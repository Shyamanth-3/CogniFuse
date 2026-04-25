import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Upload from './pages/Upload';
import Flashcards from './pages/Flashcards';
import Quiz from './pages/Quiz';
import MindMap from './pages/MindMap';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Landing from './pages/Landing';
import { supabase } from './supabaseClient';
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, session }) {
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/40 backdrop-blur-xl">
      {/* Logo */}
      <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 opacity-80 group-hover:opacity-100 transition-opacity" />
          <svg className="relative w-8 h-8 p-1.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <span className="text-lg font-bold tracking-tight text-gradient">CogniFuse</span>
      </NavLink>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        <NavLink to="/dashboard" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Dashboard
        </NavLink>
        <NavLink to="/flashcards" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Flashcards
        </NavLink>
        <NavLink to="/quiz" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Quiz
        </NavLink>
        <NavLink to="/mindmap" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Mind Map
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Analytics
        </NavLink>
      </div>

      {/* Auth */}
      <div className="flex items-center gap-4">
        <div className="badge-purple text-xs">AI-Powered</div>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      {session && <Navbar />}
      <main className={`${session ? 'pt-14' : ''} min-h-screen border-t border-white/5 bg-gray-950`}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
          
          <Route path="/dashboard" element={<ProtectedRoute session={session}><Upload /></ProtectedRoute>} />
          <Route path="/flashcards" element={<ProtectedRoute session={session}><Flashcards /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute session={session}><Quiz /></ProtectedRoute>} />
          <Route path="/mindmap" element={<ProtectedRoute session={session}><MindMap /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute session={session}><Analytics /></ProtectedRoute>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
