import React, { createContext, useContext, useState, useCallback } from 'react';

const CompareContext = createContext(null);

const MAX_COMPARE = 3;

export function CompareProvider({ children }) {
  const [items, setItems] = useState([]); // array of product objects (id, name, category_id, ...)
  const [categoryId, setCategoryId] = useState(null);

  const addToCompare = useCallback((product) => {
    setItems((prev) => {
      if (prev.length >= MAX_COMPARE) return prev;
      if (prev.find((p) => p.id === product.id)) return prev;
      if (prev.length > 0 && prev[0].category_id !== product.category_id) return prev;
      const next = [...prev, product];
      if (next.length === 1) setCategoryId(product.category_id);
      return next;
    });
  }, []);

  const removeFromCompare = useCallback((id) => {
    setItems((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (next.length === 0) setCategoryId(null);
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => {
    setItems([]);
    setCategoryId(null);
  }, []);

  const isSelected = useCallback((id) => items.some((p) => p.id === id), [items]);

  const canCompare = useCallback((product) => {
    if (items.length >= MAX_COMPARE) return false;
    if (items.find((p) => p.id === product.id)) return false;
    if (items.length > 0 && items[0].category_id !== product.category_id) return false;
    return true;
  }, [items]);

  return (
    <CompareContext.Provider value={{
      items, categoryId, addToCompare, removeFromCompare,
      clearCompare, isSelected, canCompare, maxItems: MAX_COMPARE,
    }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
