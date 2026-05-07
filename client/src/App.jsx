import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import { CompareProvider, useCompare } from './hooks/useCompare';
import { fetchCompareProducts } from './api';
import CompareTray from './components/CompareTray';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Vendors from './pages/Vendors';
import Analytics from './pages/Analytics';
import Compare from './pages/Compare';

function AppInner() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [themeIcon, setThemeIcon] = useState('☀');
  const [searchQuery, setSearchQuery] = useState('');
  const compare = useCompare();

  // Parse ?compare=1,2,3 from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ids = params.get('compare');
    if (ids) {
      const idList = ids.split(',').map(Number).filter((n) => n > 0);
      if (idList.length >= 2 && idList.length <= 3) {
        fetchCompareProducts(idList).then(({ products }) => {
          compare.clearCompare();
          products.forEach((p) => compare.addToCompare(p));
          setCurrentPage('compare');
        }).catch(() => {});
      }
    }
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
  };

  const handleNavigate = (page) => {
    if (page !== 'products') setSearchQuery('');
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'products': return <Products initialSearch={searchQuery} />;
      case 'orders': return <Orders />;
      case 'vendors': return <Vendors />;
      case 'analytics': return <Analytics />;
      case 'compare': return <Compare onBack={() => setCurrentPage('products')} />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onSearch={handleSearch}
      collapsed={collapsed}
      onToggleSidebar={() => setCollapsed(!collapsed)}
      onToggleTheme={toggleTheme}
      themeIcon={themeIcon}
    >
      {renderPage()}
      {currentPage !== 'compare' && (
        <CompareTray onCompare={() => setCurrentPage('compare')} />
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <CompareProvider>
        <AppInner />
      </CompareProvider>
    </ToastProvider>
  );
}
