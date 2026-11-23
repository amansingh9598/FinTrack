import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon, tone = 'neutral', change, invertChange = false, hint }) {
  const good = change == null ? null : invertChange ? change <= 0 : change >= 0;
  return (
    <div className={`stat stat-${tone}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {Icon && <span className="stat-icon"><Icon size={18} /></span>}
      </div>
      <div className="stat-value">{value}</div>
      {change != null ? (
        <div className={`stat-change ${good ? 'good' : 'bad'}`}>
          {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(change)}% vs last month
        </div>
      ) : (
        hint && <div className="stat-change muted">{hint}</div>
      )}
    </div>
  );
}
