import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api';
import Logo from '../components/Logo';

export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const { login, register, demo } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      navigate('/app');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    run(() => (isLogin ? login(form.email, form.password) : register(form.name, form.email, form.password)));
  };

  return (
    <div className="auth-page">
      <aside className="auth-side">
        <Link to="/"><Logo light /></Link>
        <div>
          <h2>Your money, finally in one clear picture.</h2>
          <p>Track what comes in, see where it goes, and know what you will have saved by next quarter.</p>
        </div>
        <small>Free to use. Your data stays in your account.</small>
      </aside>

      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <Link to="/" className="only-mobile"><Logo /></Link>
          <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="muted">{isLogin ? 'Sign in to see your latest numbers.' : 'It takes under a minute.'}</p>

          {!isLogin && (
            <label>Full name
              <input value={form.name} onChange={set('name')} placeholder="Aarav Sharma" required autoComplete="name" />
            </label>
          )}
          <label>Email
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required autoComplete="email" />
          </label>
          <label>Password
            <input type="password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" required minLength={6} autoComplete={isLogin ? 'current-password' : 'new-password'} />
          </label>

          {error && <div className="alert" role="alert">{error}</div>}

          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
          </button>
          <button type="button" className="btn btn-ghost btn-block" disabled={busy} onClick={() => run(demo)}>
            Explore with sample data
          </button>

          <p className="auth-switch">
            {isLogin ? <>New to FinTrack? <Link to="/register">Create an account</Link></> : <>Already have an account? <Link to="/login">Sign in</Link></>}
          </p>
        </form>
      </section>
    </div>
  );
}
