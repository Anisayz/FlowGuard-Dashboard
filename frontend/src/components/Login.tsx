import React, { useState } from 'react';
import { getMe, login } from '../services/api';

type Props = { onLoggedIn: () => void };

const inputStyle: React.CSSProperties = {
  background: '#14141e',
  border: '1px solid #2a2a3a',
  borderRadius: '8px',
  color: '#e0e0ff',
  padding: '10px 12px',
  fontSize: '13px',
  fontFamily: 'monospace',
  outline: 'none',
  width: '100%',
};

const Login: React.FC<Props> = ({ onLoggedIn }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      await getMe(); // validate token
      onLoggedIn();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Échec de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #0a0a12, #14141e)',
      padding: 24,
      fontFamily: 'monospace',
    }}>
      <div style={{
        width: 420,
        maxWidth: '100%',
        background: 'linear-gradient(135deg, #1e1e2a, #14141e)',
        border: '1px solid #2a2a3a',
        borderRadius: 14,
        padding: 22,
      }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: '#00ff88', fontWeight: 'bold', fontSize: 18 }}>🛡️ FlowGuard SDN</div>
          <div style={{ color: '#8888aa', fontSize: 12, marginTop: 6 }}>Connexion requise</div>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ color: '#8888aa', fontSize: 11 }}>Identifiant</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ color: '#8888aa', fontSize: 11 }}>Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          </div>

          {error && (
            <div style={{
              background: '#ff006611',
              border: '1px solid #ff0066',
              color: '#ff7aa5',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 12,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #00ff88, #00aa55)',
              border: 'none',
              borderRadius: 10,
              color: '#0a0a12',
              padding: '11px 14px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontFamily: 'monospace',
            }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>

          <div style={{ color: '#8888aa', fontSize: 11, lineHeight: 1.4 }}>
            Par défaut: <span style={{ color: '#e0e0ff' }}>admin / admin</span> (modifiable via variables d’environnement backend).
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

