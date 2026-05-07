import React from 'react';

function trendIcon(value, benchmark, lowerIsBetter = false) {
  const diff = lowerIsBetter ? benchmark - value : value - benchmark;
  if (Math.abs(diff) < 0.05) return { icon: '→', cls: 'trend-neutral' };
  if (diff > 0) return { icon: '↑', cls: 'trend-up' };
  return { icon: '↓', cls: 'trend-down' };
}

function KpiCard({ label, value, unit, benchmark, benchmarkLabel, lowerIsBetter }) {
  const trend = trendIcon(parseFloat(value), parseFloat(benchmark), lowerIsBetter);
  return (
    <div className="scorecard-kpi">
      <div className="scorecard-kpi-label">{label}</div>
      <div className="scorecard-kpi-value">
        {value}{unit && <span className="scorecard-kpi-unit">{unit}</span>}
        <span className={`scorecard-trend ${trend.cls}`}>{trend.icon}</span>
      </div>
      <div className="scorecard-benchmark">
        <div className="scorecard-benchmark-bar">
          <div
            className={`scorecard-benchmark-fill ${trend.cls}`}
            style={{ width: `${Math.min(100, Math.max(5, (value / (benchmark * 2)) * 100))}%` }}
          />
        </div>
        <span className="scorecard-benchmark-label">Mkt avg: {benchmark}{unit || ''}</span>
      </div>
    </div>
  );
}

export default function VendorScorecard({ scorecard, compact }) {
  if (!scorecard) return null;
  const s = scorecard;

  if (compact) {
    const reviewTrend = trendIcon(parseFloat(s.avg_review_score), parseFloat(s.mkt_review_score));
    const defectTrend = trendIcon(parseFloat(s.defect_rate), parseFloat(s.mkt_defect_rate), true);
    return (
      <div className="scorecard-compact">
        <div className="scorecard-compact-item">
          <span className="scorecard-compact-label">Review</span>
          <span className="scorecard-compact-value">
            {Number(s.avg_review_score).toFixed(1)}
            <span className={`scorecard-trend-sm ${reviewTrend.cls}`}>{reviewTrend.icon}</span>
          </span>
        </div>
        <div className="scorecard-compact-item">
          <span className="scorecard-compact-label">Defect</span>
          <span className="scorecard-compact-value">
            {Number(s.defect_rate).toFixed(0)}%
            <span className={`scorecard-trend-sm ${defectTrend.cls}`}>{defectTrend.icon}</span>
          </span>
        </div>
        <div className="scorecard-compact-item">
          <span className="scorecard-compact-label">Fulfill</span>
          <span className="scorecard-compact-value">{Number(s.avg_fulfillment_days).toFixed(1)}d</span>
        </div>
      </div>
    );
  }

  const exportCSV = () => {
    const headers = ['Metric', 'Value', 'Marketplace Avg'];
    const rows = [
      ['Avg Review Score', s.avg_review_score, s.mkt_review_score],
      ['Order Defect Rate (%)', s.defect_rate, s.mkt_defect_rate],
      ['Avg Fulfillment (days)', s.avg_fulfillment_days, s.mkt_fulfillment_days],
      ['Avg Response Time (hrs)', s.avg_response_hours, s.mkt_response_hours],
      ['Total Orders', s.total_orders, ''],
      ['Total Revenue ($)', (s.total_revenue / 100).toFixed(2), ''],
      ['Review Count', s.review_count, ''],
    ];
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor-${s.slug || s.id}-scorecard.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="scorecard-full">
      <div className="scorecard-header">
        <h3 className="scorecard-title">Performance Scorecard</h3>
        <button className="btn btn-ghost scorecard-export" onClick={exportCSV}>📥 Export</button>
      </div>
      <div className="scorecard-grid">
        <KpiCard
          label="Avg Review Score"
          value={Number(s.avg_review_score).toFixed(2)}
          benchmark={Number(s.mkt_review_score).toFixed(2)}
          benchmarkLabel="Marketplace"
        />
        <KpiCard
          label="Order Defect Rate"
          value={Number(s.defect_rate).toFixed(1)}
          unit="%"
          benchmark={Number(s.mkt_defect_rate).toFixed(1)}
          lowerIsBetter
        />
        <KpiCard
          label="Avg Fulfillment"
          value={Number(s.avg_fulfillment_days).toFixed(1)}
          unit=" days"
          benchmark={Number(s.mkt_fulfillment_days).toFixed(1)}
          lowerIsBetter
        />
        <KpiCard
          label="Response Time"
          value={Number(s.avg_response_hours).toFixed(1)}
          unit=" hrs"
          benchmark={Number(s.mkt_response_hours).toFixed(1)}
          lowerIsBetter
        />
      </div>
      <div className="scorecard-summary">
        <div className="scorecard-summary-item"><strong>{s.total_orders}</strong> orders</div>
        <div className="scorecard-summary-item"><strong>${(s.total_revenue / 100).toLocaleString()}</strong> revenue</div>
        <div className="scorecard-summary-item"><strong>{s.review_count}</strong> reviews</div>
      </div>
    </div>
  );
}
