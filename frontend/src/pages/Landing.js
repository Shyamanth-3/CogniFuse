
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useState, useEffect } from 'react';

export default function Landing() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  return (
    <div className="landing-container" style={styles.container}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.logo}>CogniFuse</div>
        <div style={styles.navLinks}>
          {session ? (
            <button onClick={() => navigate('/dashboard')} style={styles.primaryBtn}>Enter Dashboard</button>
          ) : (
            <>
              <Link to="/login" style={styles.secondaryBtn}>Sign In</Link>
              <Link to="/login" style={styles.primaryBtn}>Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroBadge}>✨ AI-Powered Neural Learning</div>
        <h1 style={styles.heroTitle}>Ignite Your <span style={styles.gradientText}>Second Brain</span></h1>
        <p style={styles.heroSubtitle}>
          CogniFuse transforms your static notes into dynamic,
          AI-driven knowledge graphs. Master any topic faster with
          topological sort, root-cause diagnosis, and spaced repetition.
        </p>

        <div style={styles.ctaGroup}>
          <button
            onClick={() => navigate(session ? '/dashboard' : '/login')}
            style={styles.heroCta}
          >
            {session ? 'Go to Dashboard' : 'Launch Your Neural Map →'}
          </button>
          <div style={styles.socialProof}>Join 10,000+ effective learners</div>
        </div>
      </div>

      {/* Features Section */}
      <div style={styles.features}>
        <div style={styles.featureCard}>
          <div style={styles.featureIcon}>🧠</div>
          <h3 style={styles.featureTitle}>Knowledge Graphs</h3>
          <p style={styles.featureText}>Automatically visualize concept relationships and prerequisite paths.</p>
        </div>
        <div style={styles.featureCard}>
          <div style={styles.featureIcon}>🎯</div>
          <h3 style={styles.featureTitle}>Root Cause Analysis</h3>
          <p style={styles.featureText}>AI detects exactly which foundation concept you're missing when you fail a quiz.</p>
        </div>
        <div style={styles.featureCard}>
          <div style={styles.featureIcon}>⚡</div>
          <h3 style={styles.featureTitle}>Spaced Repetition</h3>
          <p style={styles.featureText}>Optimized review schedules powered by the SM-2 learning algorithm.</p>
        </div>
      </div>

      {/* Background decoration */}
      <div style={styles.blob1}></div>
      <div style={styles.blob2}></div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#020617',
    color: '#fff',
    fontFamily: "'Inter', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 4rem',
    position: 'relative',
    zIndex: 10,
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: '800',
    background: 'linear-gradient(to right, #818cf8, #c084fc)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  navLinks: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
  },
  primaryBtn: {
    background: '#6366f1',
    color: '#fff',
    padding: '0.6rem 1.25rem',
    borderRadius: '0.75rem',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.2s',
  },
  secondaryBtn: {
    color: '#94a3b8',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '0.9rem',
    transition: 'color 0.2s',
  },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '8rem 2rem 4rem 2rem',
    position: 'relative',
    zIndex: 10,
  },
  heroBadge: {
    background: 'rgba(99, 102, 241, 0.1)',
    color: '#818cf8',
    padding: '0.5rem 1.25rem',
    borderRadius: '2rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    marginBottom: '2rem',
  },
  heroTitle: {
    fontSize: '4.5rem',
    fontWeight: '900',
    letterSpacing: '-0.05em',
    lineHeight: '1',
    maxWidth: '900px',
    marginBottom: '1.5rem',
  },
  gradientText: {
    background: 'linear-gradient(to right, #818cf8, #c084fc)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: '#94a3b8',
    maxWidth: '700px',
    lineHeight: '1.6',
    marginBottom: '3rem',
  },
  ctaGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
  },
  heroCta: {
    background: 'linear-gradient(to right, #6366f1, #a855f7)',
    color: '#fff',
    padding: '1.25rem 2.5rem',
    borderRadius: '1rem',
    fontSize: '1.125rem',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.4)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  socialProof: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '500',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    padding: '4rem 8rem',
    position: 'relative',
    zIndex: 10,
  },
  featureCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '2.5rem',
    borderRadius: '1.5rem',
    transition: 'all 0.3s',
  },
  featureIcon: {
    fontSize: '2.5rem',
    marginBottom: '1.5rem',
  },
  featureTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    marginBottom: '0.75rem',
    color: '#fff',
  },
  featureText: {
    color: '#64748b',
    lineHeight: '1.5',
    fontSize: '0.95rem',
  },
  blob1: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    width: '400px',
    height: '400px',
    background: 'rgba(99, 102, 241, 0.1)',
    filter: 'blur(100px)',
    borderRadius: '50%',
    zIndex: 1,
  },
  blob2: {
    position: 'absolute',
    bottom: '10%',
    right: '10%',
    width: '400px',
    height: '400px',
    background: 'rgba(192, 132, 252, 0.1)',
    filter: 'blur(100px)',
    borderRadius: '50%',
    zIndex: 1,
  }
};
