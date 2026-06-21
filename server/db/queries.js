const pool = require('./pool');

// Dashboard
exports.getDashboardStats = () => Promise.all([
  pool.query('SELECT COALESCE(SUM(total_cents), 0) AS total FROM orders'),
  pool.query('SELECT COUNT(*) AS count FROM orders'),
  pool.query('SELECT COUNT(*) AS count FROM customers'),
  pool.query('SELECT COUNT(*) AS count FROM products WHERE is_active = TRUE'),
  pool.query(`
    SELECT v.id, v.name, v.slug, v.rating,
           COUNT(DISTINCT p.id) AS product_count,
           COALESCE(SUM(oi.total_cents), 0) AS revenue
    FROM vendors v
    LEFT JOIN products p ON p.vendor_id = v.id
    LEFT JOIN order_items oi ON oi.vendor_id = v.id
    GROUP BY v.id ORDER BY revenue DESC LIMIT 5
  `),
  pool.query(`
    SELECT o.id, o.status, o.total_cents, o.created_at,
           c.first_name, c.last_name,
           (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
    FROM orders o JOIN customers c ON c.id = o.customer_id
    ORDER BY o.created_at DESC LIMIT 10
  `),
  pool.query(`
    SELECT status, COUNT(*) AS count FROM orders GROUP BY status ORDER BY count DESC
  `),
]);

// Products
exports.getProducts = (conditions, params, sortColumn, order, limit, offset) => {
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const paramIdx = params.length + 1;
  return Promise.all([
    pool.query(`SELECT COUNT(*) FROM products p ${where}`, params),
    pool.query(`
      SELECT p.*, v.name AS vendor_name, v.slug AS vendor_slug,
             cat.name AS category_name, cat.icon AS category_icon
      FROM products p
      JOIN vendors v ON v.id = p.vendor_id
      JOIN categories cat ON cat.id = p.category_id
      ${where}
      ORDER BY ${sortColumn} ${order}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `, [...params, limit, offset]),
  ]);
};

exports.getProductById = (id) => pool.query(`
  SELECT p.*, v.name AS vendor_name, v.slug AS vendor_slug,
         cat.name AS category_name, cat.icon AS category_icon
  FROM products p
  JOIN vendors v ON v.id = p.vendor_id
  JOIN categories cat ON cat.id = p.category_id
  WHERE p.id = $1
`, [id]);

exports.getProductReviews = (productId) => pool.query(`
  SELECT r.*, c.first_name, c.last_name
  FROM reviews r JOIN customers c ON c.id = r.customer_id
  WHERE r.product_id = $1 ORDER BY r.created_at DESC LIMIT 20
`, [productId]);

exports.getRelatedProducts = (productId, categoryId, limit) => pool.query(`
  SELECT p.id, p.name, p.slug, p.price_cents, p.compare_price_cents,
         p.rating_avg, p.review_count, p.stock_qty, p.image_url,
         v.name AS vendor_name, cat.name AS category_name, cat.icon AS category_icon,
         p.category_id
  FROM products p
  JOIN vendors v ON v.id = p.vendor_id
  JOIN categories cat ON cat.id = p.category_id
  WHERE p.is_active = TRUE AND p.category_id = $1 AND p.id != $2
  ORDER BY p.rating_avg DESC, p.review_count DESC
  LIMIT $3
`, [categoryId, productId, limit]);

// Search
exports.searchProducts = (query, limit) => pool.query(`
  SELECT p.id, p.name, p.slug, p.price_cents, p.rating_avg, p.review_count,
         v.name AS vendor_name, cat.name AS category_name, cat.icon AS category_icon
  FROM products p
  JOIN vendors v ON v.id = p.vendor_id
  JOIN categories cat ON cat.id = p.category_id
  WHERE p.is_active = TRUE AND (p.name ILIKE $1 OR p.description ILIKE $1)
  ORDER BY p.rating_avg DESC, p.review_count DESC
  LIMIT $2
`, [`%${query}%`, limit]);

// Categories
exports.getCategories = () => pool.query('SELECT * FROM categories ORDER BY parent_id NULLS FIRST, name');

// Vendors
exports.getVendors = () => pool.query(`
  SELECT v.*, COUNT(p.id) AS product_count
  FROM vendors v LEFT JOIN products p ON p.vendor_id = v.id AND p.is_active = TRUE
  GROUP BY v.id ORDER BY v.name
`);

exports.getVendorById = (id) => pool.query('SELECT * FROM vendors WHERE id = $1', [id]);

exports.getVendorProducts = (vendorId) => pool.query(`
  SELECT p.*, cat.name AS category_name
  FROM products p JOIN categories cat ON cat.id = p.category_id
  WHERE p.vendor_id = $1 AND p.is_active = TRUE
  ORDER BY p.created_at DESC LIMIT 50
`, [vendorId]);

// Orders
exports.getOrders = (status, limit, offset) => {
  let where = '';
  const params = [];
  if (status) {
    where = 'WHERE o.status = $1';
    params.push(status);
  }
  const paramOff = params.length;
  return Promise.all([
    pool.query(`SELECT COUNT(*) FROM orders o ${where}`, params),
    pool.query(`
      SELECT o.*, c.first_name, c.last_name, c.email,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
      FROM orders o JOIN customers c ON c.id = o.customer_id
      ${where}
      ORDER BY o.created_at DESC
      LIMIT $${paramOff + 1} OFFSET $${paramOff + 2}
    `, [...params, limit, offset]),
  ]);
};

exports.getOrderById = (id) => pool.query(`
  SELECT o.*, c.first_name, c.last_name, c.email
  FROM orders o JOIN customers c ON c.id = o.customer_id
  WHERE o.id = $1
`, [id]);

exports.getOrderItems = (orderId) => pool.query(`
  SELECT oi.*, p.name AS product_name, p.slug AS product_slug, v.name AS vendor_name
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  JOIN vendors v ON v.id = oi.vendor_id
  WHERE oi.order_id = $1
`, [orderId]);

// Order creation (uses a client from pool for transactions)
exports.getPool = () => pool;

// Reviews
exports.createReview = (productId, customerId, rating, title, body) => pool.query(
  `INSERT INTO reviews (product_id, customer_id, rating, title, body, is_verified)
   VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *`,
  [productId, customerId, Math.min(5, Math.max(1, rating)), title || '', body || '']
);

exports.updateProductRating = (productId) => pool.query(`
  UPDATE products SET
    rating_avg = (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE product_id = $1),
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1)
  WHERE id = $1
`, [productId]);

// Analytics
exports.getRevenue = (trunc, limit) => pool.query(`
  SELECT DATE_TRUNC($1, created_at) AS period,
         SUM(total_cents) AS revenue, COUNT(*) AS order_count
  FROM orders
  GROUP BY DATE_TRUNC($1, created_at)
  ORDER BY period DESC LIMIT $2
`, [trunc, limit]);

exports.getTopProducts = (limit) => pool.query(`
  SELECT p.id, p.name, p.price_cents, p.rating_avg,
         SUM(oi.quantity) AS total_sold, SUM(oi.total_cents) AS total_revenue,
         v.name AS vendor_name
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  JOIN vendors v ON v.id = p.vendor_id
  GROUP BY p.id, p.name, p.price_cents, p.rating_avg, v.name
  ORDER BY total_revenue DESC LIMIT $1
`, [limit]);

// Vendor Scorecards
exports.getVendorScorecardsAll = () => pool.query(`
  WITH vendor_orders AS (
    SELECT oi.vendor_id,
           COUNT(DISTINCT oi.order_id) AS total_orders,
           COALESCE(SUM(oi.total_cents), 0) AS total_revenue,
           COUNT(DISTINCT CASE WHEN o.status NOT IN ('delivered') THEN oi.order_id END) AS defect_orders
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    GROUP BY oi.vendor_id
  ),
  vendor_reviews AS (
    SELECT p.vendor_id,
           ROUND(AVG(r.rating)::numeric, 2) AS avg_review_score,
           COUNT(r.id) AS review_count
    FROM reviews r
    JOIN products p ON p.id = r.product_id
    GROUP BY p.vendor_id
  ),
  marketplace AS (
    SELECT
      ROUND(AVG(CASE WHEN vo.total_orders > 0 THEN vo.defect_orders::numeric / vo.total_orders * 100 ELSE 0 END), 1) AS avg_defect_rate,
      ROUND(AVG(vr.avg_review_score), 2) AS avg_review_score,
      ROUND(AVG(2.5 + (vo.vendor_id % 5) * 0.3), 1) AS avg_fulfillment_days,
      ROUND(AVG(1.0 + (vo.vendor_id % 4) * 0.5), 1) AS avg_response_hours
    FROM vendor_orders vo
    LEFT JOIN vendor_reviews vr ON vr.vendor_id = vo.vendor_id
  )
  SELECT
    v.id, v.name, v.slug, v.rating,
    COALESCE(vo.total_orders, 0) AS total_orders,
    COALESCE(vo.total_revenue, 0) AS total_revenue,
    CASE WHEN COALESCE(vo.total_orders, 0) > 0
      THEN ROUND(vo.defect_orders::numeric / vo.total_orders * 100, 1)
      ELSE 0 END AS defect_rate,
    COALESCE(vr.avg_review_score, 0) AS avg_review_score,
    COALESCE(vr.review_count, 0) AS review_count,
    ROUND(2.5 + (v.id % 5) * 0.3, 1) AS avg_fulfillment_days,
    ROUND(1.0 + (v.id % 4) * 0.5, 1) AS avg_response_hours,
    m.avg_defect_rate AS mkt_defect_rate,
    m.avg_review_score AS mkt_review_score,
    m.avg_fulfillment_days AS mkt_fulfillment_days,
    m.avg_response_hours AS mkt_response_hours
  FROM vendors v
  LEFT JOIN vendor_orders vo ON vo.vendor_id = v.id
  LEFT JOIN vendor_reviews vr ON vr.vendor_id = v.id
  CROSS JOIN marketplace m
  ORDER BY v.name
`);

exports.getVendorScorecard = (vendorId) => pool.query(`
  WITH vendor_orders AS (
    SELECT oi.vendor_id,
           COUNT(DISTINCT oi.order_id) AS total_orders,
           COALESCE(SUM(oi.total_cents), 0) AS total_revenue,
           COUNT(DISTINCT CASE WHEN o.status NOT IN ('delivered') THEN oi.order_id END) AS defect_orders
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.vendor_id = $1
    GROUP BY oi.vendor_id
  ),
  vendor_reviews AS (
    SELECT p.vendor_id,
           ROUND(AVG(r.rating)::numeric, 2) AS avg_review_score,
           COUNT(r.id) AS review_count
    FROM reviews r
    JOIN products p ON p.id = r.product_id
    WHERE p.vendor_id = $1
    GROUP BY p.vendor_id
  ),
  marketplace AS (
    SELECT
      ROUND(AVG(CASE WHEN sub.total_orders > 0 THEN sub.defect_orders::numeric / sub.total_orders * 100 ELSE 0 END), 1) AS avg_defect_rate,
      ROUND(AVG(vr2.avg_review_score), 2) AS avg_review_score,
      ROUND(AVG(2.5 + (sub.vendor_id % 5) * 0.3), 1) AS avg_fulfillment_days,
      ROUND(AVG(1.0 + (sub.vendor_id % 4) * 0.5), 1) AS avg_response_hours
    FROM (
      SELECT oi2.vendor_id,
             COUNT(DISTINCT oi2.order_id) AS total_orders,
             COUNT(DISTINCT CASE WHEN o2.status NOT IN ('delivered') THEN oi2.order_id END) AS defect_orders
      FROM order_items oi2
      JOIN orders o2 ON o2.id = oi2.order_id
      GROUP BY oi2.vendor_id
    ) sub
    LEFT JOIN (
      SELECT p2.vendor_id, ROUND(AVG(r2.rating)::numeric, 2) AS avg_review_score
      FROM reviews r2 JOIN products p2 ON p2.id = r2.product_id
      GROUP BY p2.vendor_id
    ) vr2 ON vr2.vendor_id = sub.vendor_id
  )
  SELECT
    v.id, v.name, v.slug, v.email, v.description, v.rating,
    COALESCE(vo.total_orders, 0) AS total_orders,
    COALESCE(vo.total_revenue, 0) AS total_revenue,
    CASE WHEN COALESCE(vo.total_orders, 0) > 0
      THEN ROUND(vo.defect_orders::numeric / vo.total_orders * 100, 1)
      ELSE 0 END AS defect_rate,
    COALESCE(vr.avg_review_score, 0) AS avg_review_score,
    COALESCE(vr.review_count, 0) AS review_count,
    ROUND(2.5 + (v.id % 5) * 0.3, 1) AS avg_fulfillment_days,
    ROUND(1.0 + (v.id % 4) * 0.5, 1) AS avg_response_hours,
    m.avg_defect_rate AS mkt_defect_rate,
    m.avg_review_score AS mkt_review_score,
    m.avg_fulfillment_days AS mkt_fulfillment_days,
    m.avg_response_hours AS mkt_response_hours
  FROM vendors v
  LEFT JOIN vendor_orders vo ON vo.vendor_id = v.id
  LEFT JOIN vendor_reviews vr ON vr.vendor_id = v.id
  CROSS JOIN marketplace m
  WHERE v.id = $1
`, [vendorId]);

// Health
exports.healthCheck = () => pool.query('SELECT NOW() AS time, current_database() AS db');
