import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../api';
import MonthPicker from '../components/MonthPicker';
import EmptyState from '../components/EmptyState';
import { BudgetBars } from '../components/charts';
import { EXPENSE_CATEGORIES, money, thisMonth, colorFor } from '../utils';

const STATUS = { ok: 'On track', near: 'Close to limit', over: 'Over budget', unbudgeted: 'No budget set' };

export default function Budgets() {
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [limit, setLimit] = useState('');

  const load = useCallback(() => {
    api.get('/analytics/budget-vs-actual', { params: { month } })
      .then((r) => setData(r.data))
      .catch((e) => setError(errorMessage(e)));
  }, [month]);

  useEffect(() => { setData(null); load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put('/budgets', { category, limit: Number(limit), month });
      setLimit('');
      load();
    } catch (err) { setError(errorMessage(err)); }
  };

  const remove = async (id) => {
    try { await api.delete(`/budgets/${id}`); load(); } catch (err) { setError(errorMessage(err)); }
  };

  const editRow = (r) => { setCategory(r.category); setLimit(String(r.budget || '')); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Budgets</h1>
          <p className="muted">Set a monthly limit per category and compare it with what you actually spent.</p>
        </div>
        <MonthPicker month={month} onChange={setMonth} />
      </div>

      <section className="card">
        <h3>Set a budget</h3>
        <form className="inline-form" onSubmit={save}>
          <label>Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label>Monthly limit (₹)
            <input type="number" min="0" required value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="e.g. 8000" />
          </label>
          <button className="btn btn-primary"><Plus size={18} /> Save budget</button>
        </form>
        {error && <div className="alert">{error}</div>}
      </section>

      {!data ? <div className="loading">Loading…</div> : data.rows.length === 0 ? (
        <section className="card"><EmptyState title="No budgets for this month" text="Set a limit above to start comparing budget against actual spending." /></section>
      ) : (
        <>
          <div className="stat-grid three">
            <div className="stat stat-ink"><span className="stat-label">Total budget</span><div className="stat-value">{money(data.totalBudget)}</div></div>
            <div className="stat stat-amber"><span className="stat-label">Spent so far</span><div className="stat-value">{money(data.totalActual)}</div></div>
            <div className={`stat ${data.totalBudget - data.totalActual >= 0 ? 'stat-teal' : 'stat-coral'}`}>
              <span className="stat-label">{data.totalBudget - data.totalActual >= 0 ? 'Left to spend' : 'Over by'}</span>
              <div className="stat-value">{money(Math.abs(data.totalBudget - data.totalActual))}</div>
            </div>
          </div>

          <section className="card">
            <h3>Budget vs actual</h3>
            <p className="muted small">Red bars mark categories that went over their limit</p>
            <BudgetBars rows={data.rows} />
          </section>

          <section className="card">
            <h3>Category progress</h3>
            <ul className="progress-list">
              {data.rows.map((r) => (
                <li key={r.category}>
                  <div className="progress-top">
                    <span className="pill"><i style={{ background: colorFor(r.category) }} />{r.category}</span>
                    <span className={`status status-${r.status}`}>{STATUS[r.status]}</span>
                  </div>
                  <div className="bar"><div className={`bar-fill ${r.status}`} style={{ width: `${Math.min(r.usedPercent ?? 100, 100)}%` }} /></div>
                  <div className="progress-bottom">
                    <span>{money(r.actual)} of {r.budget ? money(r.budget) : '—'}</span>
                    <span className="row-actions">
                      <button className="link" onClick={() => editRow(r)}>{r.budget ? 'Change' : 'Set budget'}</button>
                      {r.budgetId && <button className="icon-btn danger" onClick={() => remove(r.budgetId)} aria-label={`Remove ${r.category} budget`}><Trash2 size={15} /></button>}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
