import { FormEvent, useEffect, useMemo, useState } from 'react';
import './App.css';
import { api, setToken, wsUrl } from './api';
import { AlertRow, Analytics, RoundRow, Strategy } from './types';

type AuthState = { token: string; email: string } | null;

const defaultStrategy = {
  name: 'Low Streak Alert',
  enabled: true,
  cooldownSeconds: 60,
  conditions: [{ type: 'streak_below', value: 10, occurrences: 3 }],
  alert: { channel: 'telegram' }
};

function App() {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    return token && email ? { token, email } : null;
  });
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [liveMultiplier, setLiveMultiplier] = useState<number | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [rounds, setRounds] = useState<RoundRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [gameUrl, setGameUrl] = useState('');

  const refreshData = async () => {
    const [strategiesRes, roundsRes, analyticsRes, alertsRes] = await Promise.all([
      api.get('/api/strategies'),
      api.get('/api/data/rounds', { params: { limit: 50, gameUrl } }),
      api.get('/api/data/analytics', { params: { gameUrl } }),
      api.get('/api/data/alerts', { params: { limit: 50 } })
    ]);

    setStrategies(strategiesRes.data);
    setRounds(roundsRes.data);
    setAnalytics(analyticsRes.data);
    setAlerts(alertsRes.data);
  };

  useEffect(() => {
    setToken(auth?.token ?? null);
    if (!auth) return;
    refreshData().catch(() => setError('Failed to load dashboard data'));

    const socket = new WebSocket(wsUrl(auth.token));
    socket.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      if (parsed.type === 'round_event' && parsed.event?.multiplier) {
        setLiveMultiplier(parsed.event.multiplier);
      }
    };

    return () => socket.close();
  }, [auth, gameUrl]);

  const sortedRounds = useMemo(() => rounds.slice(0, 100), [rounds]);

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));
    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const response = await api.post(endpoint, { email, password });
      const token = response.data.token as string;
      localStorage.setItem('token', token);
      localStorage.setItem('email', response.data.user.email);
      setAuth({ token, email: response.data.user.email });
      setError('');
    } catch {
      setError('Authentication failed');
    }
  };

  const saveStrategy = async () => {
    await api.post('/api/strategies', defaultStrategy);
    refreshData();
  };

  const removeStrategy = async (id: string) => {
    await api.delete(`/api/strategies/${id}`);
    refreshData();
  };

  if (!auth) {
    return (
      <main className="auth-layout">
        <form onSubmit={submitAuth} className="card auth-card">
          <h1>1win Crash Observer</h1>
          <p>Live observation and alerting only.</p>
          <label>Email<input name="email" type="email" required /></label>
          <label>Password<input name="password" type="password" minLength={8} required /></label>
          <button type="submit">{isSignup ? 'Create account' : 'Login'}</button>
          <button type="button" className="ghost" onClick={() => setIsSignup((v) => !v)}>
            {isSignup ? 'Have an account? Login' : 'Need an account? Sign up'}
          </button>
          {error && <small className="error">{error}</small>}
        </form>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <header className="card row between">
        <div>
          <h1>Live 1win Crash Dashboard</h1>
          <p>{auth.email}</p>
        </div>
        <div className="live-pill">Live multiplier: {liveMultiplier ? `${liveMultiplier.toFixed(2)}x` : 'Waiting...'}</div>
      </header>

      <section className="grid">
        <article className="card">
          <h2>Analytics</h2>
          <label>Game URL filter<input value={gameUrl} onChange={(event) => setGameUrl(event.target.value)} placeholder="https://..." /></label>
          <button onClick={() => refreshData()}>Refresh</button>
          <ul>
            <li>Rounds: {analytics?.rounds ?? 0}</li>
            <li>Average: {analytics?.averageMultiplier ?? 0}</li>
            <li>Volatility: {analytics?.volatility ?? 0}</li>
            <li>Low crashes (&lt;10x): {analytics?.lowCrashes ?? 0}</li>
          </ul>
        </article>

        <article className="card">
          <div className="row between">
            <h2>Strategies</h2>
            <button onClick={saveStrategy}>Add default</button>
          </div>
          <div className="scroll">
            {strategies.map((strategy) => (
              <div key={strategy._id} className="item row between">
                <div>
                  <strong>{strategy.name}</strong>
                  <p>{strategy.conditions.map((c) => `${c.type}:${c.value} (${c.occurrences})`).join(', ')}</p>
                </div>
                <button onClick={() => removeStrategy(strategy._id)} className="danger">Delete</button>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <h2>Recent Rounds</h2>
          <div className="scroll">
            <table>
              <thead><tr><th>Round</th><th>Multiplier</th><th>Time</th></tr></thead>
              <tbody>
                {sortedRounds.map((round) => (
                  <tr key={round._id}><td>{round.roundId}</td><td>{round.multiplier.toFixed(2)}x</td><td>{new Date(round.endedAt).toLocaleTimeString()}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card">
          <h2>Alert Log</h2>
          <div className="scroll">
            {alerts.map((alert) => (
              <div key={alert._id} className="item">
                #{alert.roundId} • {alert.multiplier.toFixed(2)}x • {alert.channel} • {alert.delivered ? 'sent' : `failed: ${alert.error ?? 'unknown'}`}
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

export default App;
