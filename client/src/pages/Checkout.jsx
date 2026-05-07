import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { createOrder } from '../api';

const fmt = (cents) => '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const gradClass = (id) => 'grad-' + ((id % 10) + 1);

export default function Checkout({ onConfirm, onBack }) {
  const { items, subtotal, tax, shipping, total } = useCart();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    address: '', city: '', state: '', zip: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  if (items.length === 0) {
    return (
      <div className="loading-screen">
        <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Your cart is empty</div>
        <button className="btn btn-primary" onClick={onBack}>Browse Products</button>
      </div>
    );
  }

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.address.trim()) e.address = 'Required';
    if (!form.city.trim()) e.city = 'Required';
    if (!form.state.trim()) e.state = 'Required';
    if (!form.zip.trim()) e.zip = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const orderData = {
        customer_id: 1,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      };
      const result = await createOrder(orderData);
      if (result.error) throw new Error(result.error);
      onConfirm(result, form);
    } catch (err) {
      setSubmitError(err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="checkout-page">
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 16 }}>
        ← Back to Shopping
      </button>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Checkout</h1>

      <div className="checkout-grid">
        <form onSubmit={handleSubmit} className="checkout-form">
          <h3 className="checkout-section-title">Shipping Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} className={errors.firstName ? 'input-error' : ''} />
              {errors.firstName && <span className="field-error">{errors.firstName}</span>}
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} className={errors.lastName ? 'input-error' : ''} />
              {errors.lastName && <span className="field-error">{errors.lastName}</span>}
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} className={errors.email ? 'input-error' : ''} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label>Address</label>
            <input value={form.address} onChange={(e) => setField('address', e.target.value)} className={errors.address ? 'input-error' : ''} />
            {errors.address && <span className="field-error">{errors.address}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input value={form.city} onChange={(e) => setField('city', e.target.value)} className={errors.city ? 'input-error' : ''} />
              {errors.city && <span className="field-error">{errors.city}</span>}
            </div>
            <div className="form-group" style={{ maxWidth: 120 }}>
              <label>State</label>
              <input value={form.state} onChange={(e) => setField('state', e.target.value)} className={errors.state ? 'input-error' : ''} />
              {errors.state && <span className="field-error">{errors.state}</span>}
            </div>
            <div className="form-group" style={{ maxWidth: 120 }}>
              <label>ZIP</label>
              <input value={form.zip} onChange={(e) => setField('zip', e.target.value)} className={errors.zip ? 'input-error' : ''} />
              {errors.zip && <span className="field-error">{errors.zip}</span>}
            </div>
          </div>

          <h3 className="checkout-section-title" style={{ marginTop: 24 }}>Payment</h3>
          <div className="payment-placeholder">
            <div style={{ fontSize: 24, marginBottom: 8 }}>💳</div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Demo Mode</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No real payment will be processed. Click "Place Order" to simulate a purchase.</div>
          </div>

          {submitError && (
            <div className="checkout-error">{submitError}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '14px 16px', fontSize: 15, marginTop: 16 }}
            disabled={submitting}
          >
            {submitting ? 'Placing Order...' : `Place Order · ${fmt(total)}`}
          </button>
        </form>

        <div className="checkout-summary">
          <h3 className="checkout-section-title">Order Summary</h3>
          <div className="checkout-items">
            {items.map(({ product: p, quantity }) => (
              <div key={p.id} className="checkout-item">
                <div className={`checkout-item-img ${gradClass(p.id)}`}>{p.category_icon || '📦'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Qty: {quantity}</div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{fmt(p.price_cents * quantity)}</div>
              </div>
            ))}
          </div>
          <div className="cart-summary" style={{ marginTop: 16 }}>
            <div className="cart-summary-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="cart-summary-row"><span>Tax (8%)</span><span>{fmt(tax)}</span></div>
            <div className="cart-summary-row"><span>Shipping</span><span>{shipping === 0 ? 'Free' : fmt(shipping)}</span></div>
            <div className="cart-summary-row cart-summary-total"><span>Total</span><span>{fmt(total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
