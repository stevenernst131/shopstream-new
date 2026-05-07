import React, { useState, useEffect } from 'react';
import { fetchProduct, fetchRelatedProducts } from '../api';
import ProductCard from '../components/ProductCard';
import StarRating from '../components/StarRating';

const fmt = (cents) => '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const gradClass = (id) => 'grad-' + ((id % 10) + 1);
const stockClass = (qty) => qty > 20 ? 'stock-ok' : qty > 0 ? 'stock-low' : 'stock-out';
const stockLabel = (qty) => qty > 20 ? 'In Stock' : qty > 0 ? `Only ${qty} left` : 'Out of Stock';

export default function ProductDetail({ productId, onBack, onProductClick }) {
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setQty(1);
      setAddedToCart(false);
      try {
        const [detail, rel] = await Promise.all([
          fetchProduct(productId),
          fetchRelatedProducts(productId),
        ]);
        if (cancelled) return;
        setProduct(detail.product);
        setReviews(detail.reviews);
        setRelated(rel.products);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [productId]);

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /><div>Loading product...</div></div>;
  if (error) return (
    <div className="loading-screen">
      <div style={{ color: 'var(--red)' }}>Error loading product</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{error}</div>
      <button className="btn btn-ghost" onClick={onBack} style={{ marginTop: 12 }}>← Back to Products</button>
    </div>
  );
  if (!product) return null;

  const p = product;
  const catIcon = p.category_icon || '📦';
  const inStock = p.stock_qty > 0;
  const ratingDist = getRatingDistribution(reviews);

  return (
    <div className="pd-page">
      <button className="pd-back" onClick={onBack}>← Back to Products</button>

      <div className="pd-main">
        <div className={`pd-image ${gradClass(p.id)}`}>
          <span className="pd-image-icon">{catIcon}</span>
          {p.compare_price_cents && (
            <span className="pd-sale-badge">Sale</span>
          )}
        </div>

        <div className="pd-info">
          <div className="pd-breadcrumb">{p.category_name}</div>
          <h1 className="pd-title">{p.name}</h1>
          <div className="pd-vendor">by <span>{p.vendor_name}</span></div>

          <div className="pd-rating-row">
            <StarRating rating={p.rating_avg} />
            <span className="pd-rating-num">{Number(p.rating_avg).toFixed(1)}</span>
            <span className="pd-rating-count">({p.review_count} {p.review_count === 1 ? 'review' : 'reviews'})</span>
          </div>

          <div className="pd-price-row">
            <span className="pd-price">{fmt(p.price_cents)}</span>
            {p.compare_price_cents && (
              <span className="pd-compare-price">{fmt(p.compare_price_cents)}</span>
            )}
            {p.compare_price_cents && (
              <span className="pd-discount">
                {Math.round((1 - p.price_cents / p.compare_price_cents) * 100)}% off
              </span>
            )}
          </div>

          <div className="pd-stock">
            <span className={`stock-badge ${stockClass(p.stock_qty)}`}>{stockLabel(p.stock_qty)}</span>
          </div>

          <div className="pd-description">{p.description || 'No description available.'}</div>
          <div className="pd-sku">SKU: {p.sku || 'N/A'}</div>

          <div className="pd-actions">
            <div className="pd-qty-selector">
              <button
                className="pd-qty-btn"
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={!inStock}
              >−</button>
              <span className="pd-qty-value">{qty}</span>
              <button
                className="pd-qty-btn"
                onClick={() => setQty(Math.min(p.stock_qty, qty + 1))}
                disabled={!inStock}
              >+</button>
            </div>
            <button
              className={`pd-add-btn${addedToCart ? ' added' : ''}`}
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              {addedToCart ? '✓ Added to Cart' : inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="pd-section">
        <div className="pd-section-header">
          <h2>Customer Reviews ({reviews.length})</h2>
        </div>

        {reviews.length > 0 && (
          <div className="pd-rating-summary">
            <div className="pd-rating-big">
              <span className="pd-rating-big-num">{Number(p.rating_avg).toFixed(1)}</span>
              <StarRating rating={p.rating_avg} />
              <span className="pd-rating-big-count">{p.review_count} reviews</span>
            </div>
            <div className="pd-rating-bars">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="pd-rating-bar-row">
                  <span className="pd-rating-bar-label">{star}★</span>
                  <div className="pd-rating-bar">
                    <div className="pd-rating-bar-fill" style={{ width: `${ratingDist[star]}%` }} />
                  </div>
                  <span className="pd-rating-bar-pct">{ratingDist[star]}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pd-reviews">
          {reviews.length ? reviews.map((r) => (
            <div key={r.id} className="pd-review">
              <div className="pd-review-header">
                <div className="pd-review-author">
                  <span className="pd-review-avatar">{r.first_name?.[0]}{r.last_name?.[0]}</span>
                  <span>{r.first_name} {r.last_name}</span>
                  {r.is_verified && <span className="pd-verified">✓ Verified</span>}
                </div>
                <span className="pd-review-date">{fmtDate(r.created_at)}</span>
              </div>
              <div className="pd-review-rating"><StarRating rating={r.rating} /></div>
              {r.title && <div className="pd-review-title">{r.title}</div>}
              <div className="pd-review-body">{r.body}</div>
            </div>
          )) : (
            <div className="pd-no-reviews">No reviews yet. Be the first to review this product!</div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="pd-section">
          <div className="pd-section-header">
            <h2>Related Products</h2>
          </div>
          <div className="product-grid">
            {related.map((rp) => (
              <ProductCard
                key={rp.id}
                product={rp}
                categoryIcon={rp.category_icon}
                onClick={() => onProductClick(rp.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getRatingDistribution(reviews) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => { counts[r.rating] = (counts[r.rating] || 0) + 1; });
  const total = reviews.length || 1;
  const dist = {};
  for (let i = 1; i <= 5; i++) {
    dist[i] = Math.round((counts[i] / total) * 100);
  }
  return dist;
}
