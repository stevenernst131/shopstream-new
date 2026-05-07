import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Vendors from './pages/Vendors';
import Analytics from './pages/Analytics';
import ProductDetail from './pages/ProductDetail';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [productId, setProductId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [themeIcon, setThemeIcon] = useState('☀');
  const [searchQuery, setSearchQuery] = useState('');

  // Hash-based routing for product detail deep links
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#\/product\/(\d+)$/);
      if (match) {
        setProductId(parseInt(match[1]));
        setCurrentPage('productDetail');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    setThemeIcon(isDark ? '☾' : '☀');
  };

  const handleSearch = (q) => {
    setSearchQuery(q);
    setCurrentPage('products');
    window.location.hash = '';
  };

  const handleNavigate = (page) => {
    if (page !== 'products') setSearchQuery('');
    setCurrentPage(page);
    setProductId(null);
    window.location.hash = '';
  };

  const handleViewProduct = (id) => {
    setProductId(id);
    setCurrentPage('productDetail');
    window.location.hash = `#/product/${id}`;
  };

  const handleBackToProducts = () => {
    setCurrentPage('products');
    setProductId(null);
    window.location.hash = '';
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'products': return <Products initialSearch={searchQuery} onViewProduct={handleViewProduct} />;
      case 'productDetail': return <ProductDetail productId={productId} onBack={handleBackToProducts} onViewProduct={handleViewProduct} />;
      case 'orders': return <Orders />;
      case 'vendors': return <Vendors />;
      case 'analytics': return <Analytics />;
      default: return <Dashboard />;
    }
  };

  return (
    <ToastProvider>
      <Layout
        currentPage={currentPage === 'productDetail' ? 'products' : currentPage}
        onNavigate={handleNavigate}
        onSearch={handleSearch}
        collapsed={collapsed}
        onToggleSidebar={() => setCollapsed(!collapsed)}
        onToggleTheme={toggleTheme}
        themeIcon={themeIcon}
      >
        {renderPage()}
      </Layout>
    </ToastProvider>
  );
}
