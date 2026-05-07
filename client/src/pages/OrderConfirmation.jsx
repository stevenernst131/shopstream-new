import React from 'react';

const fmt = (cents) => '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function OrderConfirmation({ orderData, shippingInfo, onContinue }) {
  if (!orderData) return null;

  const { order, items } = orderData;

  return (
    <div className="confirmation-page">
      <div className="confirmation-card">
        <div className="confirmation-icon">✓</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Order Confirmed!</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          Thank you for your order. Your order number is <strong style={{ color: 'var(--accent)' }}>#{order.id}</strong>
        </p>

        {shippingInfo && (
          <div className="confirmation-section">
            <h3>Shipping To</h3>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7 }}>
              {shippingInfo.firstName} {shippingInfo.lastName}<br />
              {shippingInfo.address}<br />
              {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zip}<br />
              {shippingInfo.email}
            </div>
          </div>
        )}

        <div className="confirmation-section">
          <h3>Items Ordered</h3>
          <div className="confirmation-items">
            {items.map((item, i) => (
              <div key={i} className="confirmation-item">
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500 }}>Product #{item.product_id}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>× {item.quantity}</span>
                </div>
                <span style={{ fontWeight: 600 }}>{fmt(item.total_cents)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="confirmation-section">
          <h3>Order Total</h3>
          <div className="cart-summary">
            <div className="cart-summary-row"><span>Subtotal</span><span>{fmt(order.subtotal_cents)}</span></div>
            <div className="cart-summary-row"><span>Tax</span><span>{fmt(order.tax_cents)}</span></div>
            <div className="cart-summary-row"><span>Shipping</span><span>{order.shipping_cents === 0 ? 'Free' : fmt(order.shipping_cents)}</span></div>
            <div className="cart-summary-row cart-summary-total"><span>Total</span><span>{fmt(order.total_cents)}</span></div>
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '14px 16px', fontSize: 15, marginTop: 8 }}
          onClick={onContinue}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
