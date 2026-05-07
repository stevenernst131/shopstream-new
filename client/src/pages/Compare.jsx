import React, { useState, useEffect } from 'react';
import { useCompare } from '../hooks/useCompare';
import { fetchCompareProducts } from '../api';
import StarRating from '../components/StarRating';

const fmt = (cents) => '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const gradClass = (id) => 'grad-' + ((id % 10) + 1);
const stockClass = (qty) => qty > 20 ? 'stock-ok' : qty > 0 ? 'stock-low' : 'stock-out';
const stockLabel = (qty) => qty > 20 ? 'In Stock' : qty > 0 ? `${qty} left` : 'Out of Stock';

const COMPARE_ROWS = [
  { key: 'image', label: 'Product' },
  { key: 'price_cents', label: 'Price' },
  { key: 'compare_price_cents', label: 'Compare Price' },
  { key: 'vendor_name', label: 'Vendor' },
  { key: 'rating_avg', label: 'Rating' },
  { key: 'review_count', label: 'Reviews' },
  { key: 'stock_qty', label: 'Stock' },
  { key: 'sku', label: 'SKU' },
  { key: 'description', label: 'Description' },
];

export default function Compare({ onBack }) {
  const { items, clearCompare } = useCompare();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length < 2) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ids = items.map((p) => p.id);
    fetchCompareProducts(ids)
      .then(({ products: prods }) => setProducts(prods))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [items]);

  const handleShare = () => {
    const ids = products.map((p) => p.id).join(',');
    const url = `${window.location.origin}${window.location.pathname}?compare=${ids}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Comparison URL copied to clipboard!');
    }).catch(() => {
      prompt('Copy this comparison URL:', url);
    });
  };

  const handleBackAndClear = () => {
    clearCompare();
    onBack();
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /><div>Loading comparison...</div></div>;
  }

  if (products.length < 2) {
    return (
      <div className="loading-screen">
        <div style={{ fontSize: 48, marginBottom: 16 }}>⇔</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No Products to Compare</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
          Select 2–3 products from the same category to compare them side by side.
        </div>
        <button className="btn btn-primary" onClick={onBack}>Browse Products</button>
      </div>
    );
  }

  // Detect differing values for highlighting
  const isDifferent = (key) => {
    const vals = products.map((p) => p[key]);
    return !vals.every((v) => v === vals[0]);
  };

  const renderCell = (product, key) => {
    switch (key) {
      case 'image':
        return (
          <div style={{ textAlign: 'center' }}>
            <div className={`compare-product-img ${gradClass(product.id)}`}>
              {product.category_icon || '📦'}
            </div>
            <div style={{ fontWeight: 600, marginTop: 8 }}>{product.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{product.category_name}</div>
          </div>
        );
      case 'price_cents':
        return <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 16 }}>{fmt(product.price_cents)}</span>;
      case 'compare_price_cents':
        return product.compare_price_cents
          ? <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{fmt(product.compare_price_cents)}</span>
          : <span style={{ color: 'var(--text-muted)' }}>—</span>;
      case 'vendor_name':
        return product.vendor_name;
      case 'rating_avg':
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StarRating rating={product.rating_avg} />
            <span>{Number(product.rating_avg).toFixed(1)}</span>
          </span>
        );
      case 'review_count':
        return `${product.review_count} reviews`;
      case 'stock_qty':
        return <span className={`stock-badge ${stockClass(product.stock_qty)}`}>{stockLabel(product.stock_qty)}</span>;
      case 'sku':
        return product.sku || 'N/A';
      case 'description':
        return <span style={{ fontSize: 12, lineHeight: 1.5 }}>{product.description || 'No description'}</span>;
      default:
        return String(product[key] ?? '—');
    }
  };

  return (
    <div className="compare-page">
      <div className="compare-header">
        <button className="btn btn-ghost" onClick={handleBackAndClear}>← Back to Products</button>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 700 }}>Product Comparison</h2>
        <button className="btn btn-primary btn-sm" onClick={handleShare}>📋 Share</button>
      </div>
      <div className="compare-table-wrap">
        <table className="compare-table">
          <tbody>
            {COMPARE_ROWS.map((row) => (
              <tr key={row.key} className={isDifferent(row.key) && row.key !== 'image' ? 'compare-diff' : ''}>
                <th>{row.label}</th>
                {products.map((p) => (
                  <td key={p.id}>{renderCell(p, row.key)}</td>
                ))}
                {products.length === 2 && <td className="compare-empty" />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
