import React, { useState, useEffect } from 'react';
import { fetchProduct } from '../api';
import ProductCard from '../components/ProductCard';
import StarRating from '../components/StarRating';
import { useToast } from '../components/Toast';

const fmt = (cents) => '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const gradClass = (id) => 'grad-' + ((id % 10) + 1);
const stockClass = (qty) => qty > 20 ? 'stock-ok' : qty > 0 ? 'stock-low' : 'stock-out';
const stockLabel = (qty) => qty > 20 ? 'In Stock' : qty > 0 ? `Only ${qty} left` : 'Out of Stock';
const discountPct = (price, compare) => compare ? Math.round((1 - price / compare) * 100) : 0;

export default function ProductDetail({ productId, onBack, onViewProduct }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const addToast = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setQty(1);
    fetchProduct(productId)
      .then((result) => { if (!cancelled) setData(result); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  // Scroll to top when product changes
  useEffect(() => {
    document.querySelector('.main-content')?.scrollTo(0, 0);
  }, [productId]);

  if (loading) return <div className="loading-screen"><div className="spinner" /><div>Loading product...</div></div>;
  if (error) return (
    <div className="loading-screen">
      <div style={{ color: 'var(--red)' }}>Error loading product</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{error}</div>
      <button className="btn btn-ghost" onClick={onBack} style={{ marginTop: 12 }}>← Back to Products</button>
    </div>
  );
  if (!data) return null;

  const { product: p, reviews, relatedProducts } = data;
  const catIcon = p.category_icon || '📦';
  const discount = discountPct(p.price_cents, p.compare_price_cents);
  const inStock = p.stock_qty > 0;

  const handleAddToCart = () => {
    addToast(`Added ${qty}× ${p.name} to cart`);
  };

  return (
    <div className="product-detail">
      {/* Breadcrumb */}
      <div className="product-detail-breadcrumb">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Products</button>
        <span className="breadcrumb-sep">/</span>
        <span>{p.category_name}</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{p.name}</span>
      </div>

      {/* Main grid: image + info */}
      <div className="product-detail-grid">
        <div className="product-detail-image-section">
          <div className={`product-detail-hero ${gradClass(p.id)}`}>
            <span className="product-detail-hero-icon">{catIcon}</span>
          </div>
        </div>

        <div className="product-detail-info">
          <h1 className="product-detail-name">{p.name}</h1>
          <div className="product-detail-vendor">
            by <strong>{p.vendor_name}</strong> in {p.category_name}
          </div>

          {/* Rating */}
          <div className="product-detail-rating">
            <StarRating rating={p.rating_avg} />
            <span className="rating-value">{Number(p.rating_avg).toFixed(1)}</span>
            <span className="rating-count">({p.review_count} {p.review_count === 1 ? 'review' : 'reviews'})</span>
          </div>

          {/* Price */}
          <div className="product-detail-price">
            <span className="price-current">{fmt(p.price_cents)}</span>
            {p.compare_price_cents && (
              <>
                <span className="price-compare">{fmt(p.compare_price_cents)}</span>
                <span className="price-discount">-{discount}%</span>
              </>
            )}
          </div>

          {/* Stock */}
          <div className="product-detail-stock">
            <span className={`stock-badge ${stockClass(p.stock_qty)}`}>{stockLabel(p.stock_qty)}</span>
          </div>

          {/* Description */}
          <div className="product-detail-description">
            {p.description || 'No description available.'}
          </div>

          {/* Add to Cart */}
          <div className="product-detail-actions">
            <div className="quantity-selector">
              <button
                className="qty-btn"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={!inStock}
              >−</button>
              <span className="qty-value">{qty}</span>
              <button
                className="qty-btn"
                onClick={() => setQty((q) => Math.min(p.stock_qty, q + 1))}
                disabled={!inStock}
              >+</button>
            </div>
            <button
              className="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              {inStock ? `Add to Cart — ${fmt(p.price_cents * qty)}` : 'Out of Stock'}
            </button>
          </div>

          {/* Specs */}
          <div className="product-detail-specs">
            <h3>Product Details</h3>
            <table>
              <tbody>
                <tr><td>SKU</td><td>{p.sku || 'N/A'}</td></tr>
                <tr><td>Category</td><td>{catIcon} {p.category_name}</td></tr>
                <tr><td>Vendor</td><td>{p.vendor_name}</td></tr>
                <tr><td>Added</td><td>{fmtDate(p.created_at)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="product-detail-reviews">
        <h2>Customer Reviews ({reviews.length})</h2>
        {reviews.length ? (
          <div className="reviews-list">
            {reviews.map((r) => (
              <div key={r.id} className="review-card">
                <div className="review-card-header">
                  <div className="review-card-author">
                    <span className="review-avatar">{r.first_name[0]}{r.last_name[0]}</span>
                    <div>
                      <div className="review-name">
                        {r.first_name} {r.last_name}
                        {r.is_verified && <span className="verified-badge">✓ Verified</span>}
                      </div>
                      <div className="review-date">{fmtDate(r.created_at)}</div>
                    </div>
                  </div>
                  <StarRating rating={r.rating} />
                </div>
                {r.title && <div className="review-card-title">{r.title}</div>}
                {r.body && <div className="review-card-body">{r.body}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="reviews-empty">No reviews yet. Be the first to review this product!</div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="product-detail-related">
          <h2>Related Products</h2>
          <div className="product-grid">
            {relatedProducts.map((rp) => (
              <ProductCard
                key={rp.id}
                product={rp}
                categoryIcon={rp.category_icon}
                onClick={() => onViewProduct(rp.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
