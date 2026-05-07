import React, { useState, useEffect, useCallback } from 'react';
import { fetchProducts, fetchCategories } from '../api';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';

const fmt = (cents) => '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNum = (n) => Number(n).toLocaleString('en-US');

export default function Products({ initialSearch, onProductClick }) {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState(initialSearch || '');
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reset search from parent
  useEffect(() => {
    if (initialSearch && initialSearch !== search) {
      setSearch(initialSearch);
      setPage(1);
    }
  }, [initialSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!categories) {
        try { const c = await fetchCategories(); setCategories(c.categories); } catch { setCategories([]); }
      }
      const params = { page, limit: 24, sort };
      if (search) params.search = search;
      if (category) params.category = category;
      const result = await fetchProducts(params);
      setData(result);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [page, category, sort, search]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <div className="loading-screen"><div className="spinner" /><div>Loading...</div></div>;
  if (error) return (
    <div className="loading-screen">
      <div style={{ color: 'var(--red)' }}>Error loading data</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{error}</div>
      <button className="btn btn-ghost" onClick={load} style={{ marginTop: 12 }}>Retry</button>
    </div>
  );

  const cats = categories || [];

  return (
    <>
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); load(); } }}
          style={{ width: 220 }}
        />
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.icon || ''} {c.name}</option>)}
        </select>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
          <option value="newest">Newest</option>
          <option value="price">Price</option>
          <option value="rating">Rating</option>
          <option value="name">Name</option>
        </select>
        {search && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setPage(1); }}>✕ Clear search</button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{fmtNum(data.total)} products</span>
      </div>
      <div className="product-grid">
        {data.products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            categoryIcon={(cats.find((c) => c.id === p.category_id) || {}).icon}
            onClick={() => onProductClick(p.id)}
          />
        ))}
      </div>
      <Pagination page={data.page} pages={data.pages} total={data.total} onNavigate={(p) => setPage(p)} />
    </>
  );
}
