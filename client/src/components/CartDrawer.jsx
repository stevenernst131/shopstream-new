import React from 'react';
import { useCart } from '../context/CartContext';

const fmt = (cents) => '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const gradClass = (id) => 'grad-' + ((id % 10) + 1);

export default function CartDrawer({ open, onClose, onCheckout }) {
  const { items, itemCount, subtotal, tax, shipping, total, updateQuantity, removeFromCart } = useCart();

  return (
    <>
      <div className={`panel-overlay${open ? ' open' : ''}`} onClick={onClose} />
      <div className={`panel${open ? ' open' : ''}`}>
        <button className="panel-close" onClick={onClose}>✕</button>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
          Shopping Cart {itemCount > 0 && <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>({itemCount} items)</span>}
        </h2>

        {items.length === 0 ? (
          <div className="cart-empty">
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Your cart is empty</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Add products to get started</div>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map(({ product: p, quantity }) => (
                <div key={p.id} className="cart-item">
                  <div className={`cart-item-img ${gradClass(p.id)}`}>
                    {p.category_icon || '📦'}
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{p.name}</div>
                    <div className="cart-item-price">{fmt(p.price_cents)}</div>
                    <div className="cart-item-controls">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(p.id, quantity - 1)}
                        disabled={quantity <= 1}
                      >−</button>
                      <span className="qty-value">{quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(p.id, quantity + 1)}
                      >+</button>
                      <button
                        className="cart-item-remove"
                        onClick={() => removeFromCart(p.id)}
                        title="Remove"
                      >🗑</button>
                    </div>
                  </div>
                  <div className="cart-item-total">{fmt(p.price_cents * quantity)}</div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Tax (8%)</span>
                <span>{fmt(tax)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : fmt(shipping)}</span>
              </div>
              {shipping > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Free shipping on orders over $50
                </div>
              )}
              <div className="cart-summary-row cart-summary-total">
                <span>Total</span>
                <span>{fmt(total)}</span>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '12px 16px' }}
                onClick={() => { onClose(); onCheckout(); }}
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
