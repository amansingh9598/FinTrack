import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PieChart, CalendarRange, Target, TrendingUp, Menu, X, ShieldCheck, Smartphone, Zap } from 'lucide-react';
import Logo from '../components/Logo';
import { BudgetBars, ForecastChart, CategoryDonut } from '../components/charts';
import { useAuth } from '../context/AuthContext';
import { money } from '../utils';

const SAMPLE_BUDGET = [
  { category: 'Housing', budget: 18000, actual: 17500, status: 'ok' },
  { category: 'Food', budget: 9000, actual: 10400, status: 'over' },
  { category: 'Transport', budget: 4000, actual: 3100, status: 'ok' },
  { category: 'Shopping', budget: 6000, actual: 5800, status: 'near' },
  { category: 'Bills', budget: 4500, actual: 4200, status: 'ok' },
];
const SAMPLE_HISTORY = [
  { month: '2026-05', savings: 17200 }, { month: '2026-06', savings: 19800 }, { month: '2026-07', savings: 18400 },
  { month: '2026-08', savings: 22100 }, { month: '2026-09', savings: 23600 }, { month: '2026-10', savings: 25100 },
];
const SAMPLE_FORECAST = [
  { month: '2026-11', savings: 26400 }, { month: '2026-12', savings: 27900 }, { month: '2027-01', savings: 29300 },
];
const SAMPLE_CATS = [
  { category: 'Housing', total: 17500 }, { category: 'Food', total: 10400 }, { category: 'Shopping', total: 5800 },
  { category: 'Transport', total: 3100 }, { category: 'Bills', total: 4200 },
];

const FEATURES = [
  { icon: CalendarRange, title: 'Monthly expense breakdown', text: 'Open any month and see income, expenses and what you kept, compared with the month before.' },
  { icon: PieChart, title: 'Category-wise spending', text: 'Food, rent, travel, shopping. Charts show which categories take the biggest share of your money.' },
  { icon: Target, title: 'Budget vs actual', text: 'Set a limit per category. Bars turn red the moment you cross it, so you can adjust mid-month.' },
  { icon: TrendingUp, title: 'Savings prediction', text: 'FinTrack studies your past months and projects what you are likely to save over the next three.' },
];

export default function Landing() {
  const [open, setOpen] = useState(false);
  const { user, demo } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const tryDemo = async () => {
    setBusy(true);
    try { await demo(); navigate('/app'); } catch { navigate('/register'); } finally { setBusy(false); }
  };

  const close = () => setOpen(false);

  return (
    <div className="landing">
      <header className="l-nav">
        <div className="l-wrap l-nav-inner">
          <Link to="/"><Logo /></Link>
          <nav className={`l-links ${open ? 'open' : ''}`}>
            <a href="#features" onClick={close}>Features</a>
            <a href="#forecast" onClick={close}>Prediction</a>
            <a href="#how" onClick={close}>How it works</a>
            <div className="l-links-cta">
              {user ? (
                <Link className="btn btn-primary" to="/app">Open dashboard</Link>
              ) : (
                <>
                  <Link className="btn btn-ghost" to="/login">Sign in</Link>
                  <Link className="btn btn-primary" to="/register">Get started</Link>
                </>
              )}
            </div>
          </nav>
          <button className="icon-btn only-mobile" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="l-wrap hero-grid">
          <div className="hero-copy">
            <h1>See where every rupee goes, and where your savings are headed.</h1>
            <p>FinTrack turns your income and expenses into clear monthly breakdowns, budget checks and a savings forecast, so the next decision about money is an easy one.</p>
            <div className="hero-cta">
              <Link className="btn btn-primary btn-lg" to="/register">Create free account</Link>
              <button className="btn btn-outline btn-lg" onClick={tryDemo} disabled={busy}>{busy ? 'Loading…' : 'Explore with sample data'}</button>
            </div>
            <ul className="hero-points">
              <li><ShieldCheck size={16} /> Private to your account</li>
              <li><Smartphone size={16} /> Works on phone, tablet and laptop</li>
              <li><Zap size={16} /> Set up in a minute</li>
            </ul>
          </div>

          <div className="hero-visual" aria-label="Example of budget versus actual spending">
            <div className="preview">
              <div className="preview-head">
                <div>
                  <small>Budget vs actual · October</small>
                  <strong>{money(41000)} spent of {money(41500)}</strong>
                </div>
                <span className="status status-over">Food is over</span>
              </div>
              <BudgetBars rows={SAMPLE_BUDGET} height={240} />
            </div>
            <div className="preview mini">
              <small>Predicted savings, next 3 months</small>
              <strong>{money(83600)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="l-section" id="features">
        <div className="l-wrap split">
          <div className="split-title">
            <h2>Everything you need to understand your money</h2>
            <p>Four views that answer the questions people actually ask: how much did I spend, on what, am I within budget, and how much will I have?</p>
          </div>
          <ul className="feature-list">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="feature-icon"><Icon size={22} /></span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="l-section tinted" id="forecast">
        <div className="l-wrap showcase">
          <div className="showcase-chart card">
            <ForecastChart history={SAMPLE_HISTORY} forecast={SAMPLE_FORECAST} height={300} />
          </div>
          <div className="showcase-copy">
            <h2>Know next quarter's savings before it starts</h2>
            <p>Your last six months set a trend. FinTrack fits a line through them, projects the next three months and tells you how steady your pattern is, so you can set a goal that is realistic.</p>
            <div className="mini-donut card">
              <CategoryDonut data={SAMPLE_CATS} height={170} />
            </div>
          </div>
        </div>
      </section>

      <section className="l-section" id="how">
        <div className="l-wrap">
          <h2 className="center">Up and running in three steps</h2>
          <ol className="steps">
            <li><span className="step-n">1</span><h3>Add your transactions</h3><p>Log income and expenses with a category and date. It takes a few seconds each.</p></li>
            <li><span className="step-n">2</span><h3>Set category budgets</h3><p>Choose how much you want to spend on food, travel, bills and more each month.</p></li>
            <li><span className="step-n">3</span><h3>Read your dashboard</h3><p>Check charts, budget progress and your savings forecast whenever you like.</p></li>
          </ol>
        </div>
      </section>

      <section className="cta-band">
        <div className="l-wrap cta-inner">
          <div>
            <h2>Start with your next transaction</h2>
            <p>Create an account, or look around first with ready-made sample data.</p>
          </div>
          <div className="hero-cta">
            <Link className="btn btn-accent btn-lg" to="/register">Create free account</Link>
            <button className="btn btn-outline-light btn-lg" onClick={tryDemo} disabled={busy}>Explore with sample data</button>
          </div>
        </div>
      </section>

      <footer className="l-footer">
        <div className="l-wrap footer-inner">
          <Logo light />
          <small>© {new Date().getFullYear()} FinTrack. Built with MongoDB, Express, React and Node.</small>
        </div>
      </footer>
    </div>
  );
}
