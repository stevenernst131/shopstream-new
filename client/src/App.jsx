import React, { useState } from 'react';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Orders from './pages/Orders';
import Vendors from './pages/Vendors';
import Analytics from './pages/Analytics';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [themeIcon, setThemeIcon] = useState('☀');
  const [searchQuery, setSearchQuery] = useState('');
  const [productId, setProductId] = useState(null);

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
    setProductId(null);
    setCurrentPage(page);
  };

  const handleProductClick = (id) => {
    setProductId(id);
    setCurrentPage('productDetail');
  };

  const handleBackToProducts = () => {
    setProductId(null);
    setCurrentPage('products');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'products': return <Products initialSearch={searchQuery} onProductClick={handleProductClick} />;
      case 'productDetail': return (
        <ProductDetail
          productId={productId}
          onBack={handleBackToProducts}
          onProductClick={handleProductClick}
        />
      );
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
