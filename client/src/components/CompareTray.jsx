import React from 'react';
import { useCompare } from '../hooks/useCompare';

const gradClass = (id) => 'grad-' + ((id % 10) + 1);

export default function CompareTray({ onCompare }) {
  const { items, removeFromCompare, clearCompare } = useCompare();

  if (items.length === 0) return null;

  return (
    <div className="compare-tray">
      <div className="compare-tray-inner">
        <div className="compare-tray-items">
          {items.map((p) => (
            <div key={p.id} className="compare-tray-item">
              <div className={`compare-tray-thumb ${gradClass(p.id)}`}>
                {p.category_icon || '📦'}
              </div>
              <span className="compare-tray-name">{p.name}</span>
              <button
                className="compare-tray-remove"
                onClick={() => removeFromCompare(p.id)}
                title="Remove"
              >✕</button>
            </div>
          ))}
        </div>
        <div className="compare-tray-actions">
          <span className="compare-tray-count">{items.length} of 3</span>
          <button className="btn btn-ghost btn-sm" onClick={clearCompare}>Clear</button>
          <button
            className="btn btn-primary btn-sm"
            disabled={items.length < 2}
            onClick={onCompare}
          >Compare Now</button>
        </div>
      </div>
    </div>
  );
}
