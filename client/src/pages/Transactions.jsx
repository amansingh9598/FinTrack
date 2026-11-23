import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import api, { errorMessage } from '../api';
import Modal from '../components/Modal';
import MonthPicker from '../components/MonthPicker';
import EmptyState from '../components/EmptyState';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, colorFor, money, fmtDate, thisMonth } from '../utils';

const blank = () => ({ type: 'expense', category: 'Food', amount: '', date: new Date().toISOString().slice(0, 10), note: '' });

export default function Transactions() {
  const [month, setMonth] = useState(thisMonth());
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | form object
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/transactions', { params: { month, type, category, search, page, limit: 12 } })
      .then((r) => setData(r.data))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [month, type, category, search, page]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => setPage(1), [month, type, category, search]);

  const save = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const body = { ...editing, amount: Number(editing.amount) };
      if (editing._id) await api.put(`/transactions/${editing._id}`, body);
      else await api.post('/transactions', body);
      setEditing(null);
      load();
    } catch (err) { setFormError(errorMessage(err)); }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete this ${t.category} ${t.type} of ${money(t.amount)}?`)) return;
    try { await api.delete(`/transactions/${t._id}`); load(); } catch (err) { setError(errorMessage(err)); }
  };

  const openEdit = (t) => setEditing({ ...t, date: t.date.slice(0, 10) });
  const cats = editing?.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Transactions</h1>
          <p className="muted">{data.total} {data.total === 1 ? 'entry' : 'entries'} in this view</p>
        </div>
        <div className="head-actions">
          <MonthPicker month={month} onChange={setMonth} />
          <button className="btn btn-primary" onClick={() => setEditing(blank())}><Plus size={18} /> Add transaction</button>
        </div>
      </div>

      <section className="card">
        <div className="filters">
          <label className="search">
            <Search size={16} />
            <input placeholder="Search notes" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search notes" />
          </label>
          <select value={type} onChange={(e) => { setType(e.target.value); setCategory(''); }} aria-label="Filter by type">
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            <option value="">All categories</option>
            {[...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {error && <div className="alert">{error}</div>}
        {loading ? <div className="loading">Loading…</div> : data.items.length === 0 ? (
          <EmptyState title="No transactions found" text="Try a different month or filter, or add a new transaction." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Category</th><th>Note</th><th className="right">Amount</th><th /></tr></thead>
              <tbody>
                {data.items.map((t) => (
                  <tr key={t._id}>
                    <td data-label="Date">{fmtDate(t.date)}</td>
                    <td data-label="Category"><span className="pill"><i style={{ background: colorFor(t.category) }} />{t.category}</span></td>
                    <td data-label="Note" className="note">{t.note || '—'}</td>
                    <td data-label="Amount" className={`right ${t.type === 'income' ? 'pos' : 'neg'}`}><b>{t.type === 'income' ? '+' : '−'}{money(t.amount)}</b></td>
                    <td className="row-actions">
                      <button className="icon-btn" onClick={() => openEdit(t)} aria-label="Edit"><Pencil size={16} /></button>
                      <button className="icon-btn danger" onClick={() => remove(t)} aria-label="Delete"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.pages > 1 && (
          <div className="pager">
            <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span>Page {page} of {data.pages}</span>
            <button className="btn btn-ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        )}
      </section>

      {editing && (
        <Modal title={editing._id ? 'Edit transaction' : 'Add transaction'} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="form-grid">
            <div className="segmented" role="group" aria-label="Type">
              {['expense', 'income'].map((t) => (
                <button type="button" key={t} className={editing.type === t ? 'on' : ''}
                  onClick={() => setEditing({ ...editing, type: t, category: t === 'income' ? 'Salary' : 'Food' })}>
                  {t === 'expense' ? 'Expense' : 'Income'}
                </button>
              ))}
            </div>
            <label>Amount (₹)
              <input type="number" min="1" step="0.01" required value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} autoFocus />
            </label>
            <label>Category
              <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                {cats.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>Date
              <input type="date" required value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
            </label>
            <label className="span-2">Note (optional)
              <input maxLength={200} value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} placeholder="What was this for?" />
            </label>
            {formError && <div className="alert span-2">{formError}</div>}
            <div className="modal-actions span-2">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary">{editing._id ? 'Save changes' : 'Add transaction'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
