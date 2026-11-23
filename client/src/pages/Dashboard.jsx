import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowDownLeft, ArrowUpRight, PiggyBank } from 'lucide-react';
import api, { errorMessage } from '../api';
import StatCard from '../components/StatCard';
import MonthPicker from '../components/MonthPicker';
import EmptyState from '../components/EmptyState';
import { TrendChart, CategoryDonut } from '../components/charts';
import { money, thisMonth, fmtDate, colorFor } from '../utils';

export default function Dashboard() {
  const [month, setMonth] = useState(thisMonth());
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    Promise.all([
      api.get('/analytics/summary', { params: { month } }),
      api.get('/analytics/monthly', { params: { months: 6 } }),
      api.get('/transactions', { params: { month, limit: 6 } }),
    ])
      .then(([s, t, r]) => {
        setSummary(s.data);
        setTrend(t.data);
        setRecent(r.data.items);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [month]);

  if (error) return <div className="alert">{error}</div>;
  if (!summary) return <div className="loading">Crunching your numbers…</div>;

  const hasData = summary.income || summary.expense;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Overview</h1>
          <p className="muted">Where your money went this month.</p>
        </div>
        <MonthPicker month={month} onChange={setMonth} />
      </div>

      <div className="stat-grid">
        <StatCard label="Income" value={money(summary.income)} icon={ArrowDownLeft} tone="teal" change={summary.change.income} />
        <StatCard label="Expenses" value={money(summary.expense)} icon={ArrowUpRight} tone="amber" change={summary.change.expense} invertChange />
        <StatCard label="Saved" value={money(summary.savings)} icon={Wallet} tone={summary.savings >= 0 ? 'teal' : 'coral'} hint={summary.savings >= 0 ? 'Income minus expenses' : 'You spent more than you earned'} />
        <StatCard label="Savings rate" value={`${summary.savingsRate}%`} icon={PiggyBank} tone="ink" hint="Share of income kept" />
      </div>

      {!hasData ? (
        <section className="card">
          <EmptyState
            title="Nothing recorded for this month"
            text="Add your first income or expense and your charts will appear here."
            action={<Link className="btn btn-primary" to="/app/transactions">Add a transaction</Link>}
          />
        </section>
      ) : (
        <>
          <div className="grid-2">
            <section className="card">
              <h3>Income vs expenses</h3>
              <p className="muted small">Last 6 months</p>
              <TrendChart data={trend} />
            </section>
            <section className="card">
              <h3>Spending by category</h3>
              <p className="muted small">Share of this month's expenses</p>
              {summary.expenseByCategory.length ? <CategoryDonut data={summary.expenseByCategory} /> : <EmptyState title="No expenses yet" text="Spending categories will show up here." />}
            </section>
          </div>

          <section className="card">
            <div className="card-head">
              <h3>Recent transactions</h3>
              <Link to="/app/transactions" className="link">View all</Link>
            </div>
            <ul className="tx-list">
              {recent.map((t) => (
                <li key={t._id}>
                  <span className="dot" style={{ background: colorFor(t.category) }} />
                  <div className="tx-main">
                    <strong>{t.category}</strong>
                    <small>{t.note || 'No note'} · {fmtDate(t.date)}</small>
                  </div>
                  <b className={t.type === 'income' ? 'pos' : 'neg'}>{t.type === 'income' ? '+' : '−'}{money(t.amount)}</b>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
