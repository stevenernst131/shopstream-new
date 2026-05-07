import React, { useState } from 'react';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import { CartProvider, useCart } from './context/CartContext';
import CartDrawer from './components/CartDrawer';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Vendors from './pages/Vendors';
import Analytics from './pages/Analytics';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';

function AppInner() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [themeIcon, setThemeIcon] = useState('☀');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [shippingInfo, setShippingInfo] = useState(null);
  const { itemCount, clearCart } = useCart();

  const toggleTheme = () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    setThemeIcon(isDark ? '☾' : '☀');
  };

  const handleSearch = (q) => {
    setSearchQuery(q);
    setCurrentPage('products');
  };

  const handleNavigate = (page) => {
    if (page !== 'products') setSearchQuery('');
    setCurrentPage(page);
  };

  const handleCheckoutConfirm = (result, form) => {
    setOrderData(result);
    setShippingInfo(form);
    clearCart();
    setCurrentPage('confirmation');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'products': return <Products initialSearch={searchQuery} />;
      case 'orders': return <Orders />;
      case 'vendors': return <Vendors />;
      case 'analytics': return <Analytics />;
      case 'checkout': return (
        <Checkout
          onConfirm={handleCheckoutConfirm}
          onBack={() => handleNavigate('products')}
        />
      );
      case 'confirmation': return (
        <OrderConfirmation
          orderData={orderData}
          shippingInfo={shippingInfo}
          onContinue={() => handleNavigate('products')}
        />
      );
      default: return <Dashboard />;
    }
  };

  return (
    <>
      <Layout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onSearch={handleSearch}
        collapsed={collapsed}
        onToggleSidebar={() => setCollapsed(!collapsed)}
        onToggleTheme={toggleTheme}
        themeIcon={themeIcon}
        cartCount={itemCount}
        onCartClick={() => setCartOpen(true)}
      >
        {renderPage()}
      </Layout>
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => handleNavigate('checkout')}
      />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <AppInner />
      </CartProvider>
    </ToastProvider>
  );
}
