import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import api, { errorMessage } from '../api';
import MonthPicker from '../components/MonthPicker';
import EmptyState from '../components/EmptyState';
import { ForecastChart, DailyChart } from '../components/charts';
import { money, monthLabel, thisMonth, colorFor } from '../utils';

export default function Insights() {
  const [month, setMonth] = useState(thisMonth());
  const [prediction, setPrediction] = useState(null);
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/analytics/prediction').then((r) => setPrediction(r.data)).catch((e) => setError(errorMessage(e)));
    api.get('/analytics/monthly', { params: { months: 6 } }).then((r) => setMonthly(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/summary', { params: { month } }),
      api.get('/analytics/daily', { params: { month } }),
    ]).then(([s, d]) => { setSummary(s.data); setDaily(d.data); }).catch((e) => setError(errorMessage(e)));
  }, [month]);

  if (error) return <div className="alert">{error}</div>;
  if (!prediction || !summary) return <div className="loading">Analysing your habits…</div>;

  const top = summary.expenseByCategory[0];
  const trendUp = prediction.trendPerMonth >= 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Insights</h1>
          <p className="muted">Spending habits and a savings forecast based on your history.</p>
        </div>
        <MonthPicker month={month} onChange={setMonth} />
      </div>

      <section className="card forecast">
        <div className="card-head">
          <div>
            <h3><Sparkles size={18} /> Savings prediction</h3>
            <p className="muted small">Linear trend fitted to your last {prediction.basedOnMonths || 0} full months</p>
          </div>
        </div>
        {!prediction.enoughData ? (
          <EmptyState title="Not enough history yet" text="Add transactions for at least two months and we will forecast your savings." />
        ) : (
          <>
            <div className="forecast-stats">
              <div><span>Average saved per month</span><strong>{money(prediction.averageSavings)}</strong></div>
              <div><span>Expected over next 3 months</span><strong>{money(prediction.next3Months)}</strong></div>
              <div>
                <span>Monthly trend</span>
                <strong className={trendUp ? 'pos' : 'neg'}>
                  {trendUp ? <TrendingUp size={18} /> : <TrendingDown size={18} />} {money(Math.abs(prediction.trendPerMonth))} {trendUp ? 'up' : 'down'}
                </strong>
              </div>
              <div><span>Forecast fit</span><strong>{Math.round(prediction.confidence * 100)}%</strong></div>
            </div>
            <ForecastChart history={prediction.history} forecast={prediction.forecast} />
            <p className="muted small">
              Forecast: {prediction.forecast.map((f) => `${monthLabel(f.month)} ${money(f.savings)}`).join(' · ')}. A higher fit means your savings follow a steadier pattern, so the forecast is more reliable.
            </p>
          </>
        )}
      </section>

      <div className="grid-2">
        <section className="card">
          <h3>Spending through {monthLabel(month, true)}</h3>
          <p className="muted small">Running total of expenses by day</p>
          <DailyChart data={daily} />
        </section>

        <section className="card">
          <h3>Category ranking</h3>
          {summary.expenseByCategory.length === 0 ? (
            <EmptyState title="No expenses this month" text="Pick another month or add a transaction." />
          ) : (
            <>
              {top && <p className="insight-line"><b>{top.category}</b> is your biggest category at {top.share}% of spending ({money(top.total)}).</p>}
              <ul className="rank-list">
                {summary.expenseByCategory.map((c) => (
                  <li key={c.category}>
                    <div className="rank-top"><span className="pill"><i style={{ background: colorFor(c.category) }} />{c.category}</span><b>{money(c.total)}</b></div>
                    <div className="bar"><div className="bar-fill" style={{ width: `${c.share}%`, background: colorFor(c.category) }} /></div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <section className="card">
        <h3>Monthly breakdown</h3>
        <div className="table-wrap">
          <table className="table compact">
            <thead><tr><th>Month</th><th className="right">Income</th><th className="right">Expenses</th><th className="right">Saved</th></tr></thead>
            <tbody>
              {[...monthly].reverse().map((m) => (
                <tr key={m.month}>
                  <td data-label="Month">{monthLabel(m.month, true)}</td>
                  <td data-label="Income" className="right">{money(m.income)}</td>
                  <td data-label="Expenses" className="right">{money(m.expense)}</td>
                  <td data-label="Saved" className={`right ${m.savings >= 0 ? 'pos' : 'neg'}`}><b>{money(m.savings)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
