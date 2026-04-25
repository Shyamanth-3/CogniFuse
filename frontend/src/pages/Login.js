import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
    } else {
      // If sign up is successful with email confirmation disabled, 
      // Supabase returns a session immediately.
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container" style={styles.container}>
      <div className="auth-card" style={styles.card}>
        <h1 style={styles.title}>CogniFuse</h1>
        <p style={styles.subtitle}>{isSignUp ? 'Create your neural map' : 'Welcome back to your second brain'}</p>
        
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleAuth} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@example.com"
              style={styles.input}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              style={styles.input}
              required
            />
          </div>
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div style={styles.switch}>
          <p style={{ marginBottom: '0.5rem' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <button 
            onClick={() => setIsSignUp(!isSignUp)} 
            style={styles.linkButton}
          >
            {isSignUp ? ' Switch to SIGN IN' : 'Create an Account (SIGN UP)'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  // ... (keeping existing layout but highlighting the button)
  container: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #020617 0%, #1e1b4b 100%)',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(16px)',
    padding: '3rem',
    borderRadius: '2rem',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  title: {
    color: '#fff',
    fontSize: '2.5rem',
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: '0.5rem',
    letterSpacing: '-0.05em',
    background: 'linear-gradient(to right, #818cf8, #c084fc, #818cf8)',
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'gradient-flow 3s linear infinite',
  },
  subtitle: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: '2.5rem',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    color: '#94a3b8',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginLeft: '0.5rem',
  },
  input: {
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '1rem',
    padding: '0.875rem 1.25rem',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },
  button: {
    marginTop: '1rem',
    background: 'linear-gradient(to right, #4f46e5, #9333ea)',
    color: '#fff',
    border: 'none',
    borderRadius: '1rem',
    padding: '1rem',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  switch: {
    marginTop: '2rem',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.85rem',
  },
  linkButton: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#a5b4fc',
    cursor: 'pointer',
    fontWeight: '700',
    padding: '0.6rem 1.2rem',
    borderRadius: '0.75rem',
    marginTop: '0.5rem',
    transition: 'all 0.2s',
  },
  error: {
    background: 'rgba(220, 38, 38, 0.1)',
    border: '1px solid rgba(220, 38, 38, 0.2)',
    color: '#f87171',
    padding: '0.8rem',
    borderRadius: '0.75rem',
    marginBottom: '1.5rem',
    fontSize: '0.85rem',
    textAlign: 'center',
    fontWeight: '500',
  }
};
