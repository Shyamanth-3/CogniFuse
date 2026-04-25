import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Animated background orbs
function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-1/4 left-1/5 w-96 h-96 rounded-full opacity-10 animate-pulse-slow"
        style={{ background: 'radial-gradient(circle, #1f4fff 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/5 w-80 h-80 rounded-full opacity-8 animate-float"
        style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', animationDelay: '-3s' }} />
      <div className="absolute top-3/4 left-1/2 w-64 h-64 rounded-full opacity-6"
        style={{ background: 'radial-gradient(circle, #0a31f5 0%, transparent 70%)' }} />
    </div>
  );
}

// Feature card
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="glass p-5 group hover:border-brand-500/30 transition-all duration-300 hover:-translate-y-1">
      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="font-semibold text-white mb-1 text-sm">{title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

export default function Upload() {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const navigate = useNavigate();

  const handleFileChange = (f) => {
    if (f) {
      setFile(f);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileChange(dropped);
  };

  const handleSubmit = async () => {
    if (!text.trim() && !file) {
      setError('Please paste some notes or upload a file.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await axios.post(`${API}/process-file`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        sessionStorage.setItem('flashcards', JSON.stringify(res.data.flashcards));
        sessionStorage.setItem('graph', JSON.stringify(res.data.graph));
        sessionStorage.setItem('ordered_concepts', JSON.stringify(res.data.ordered_concepts));
      } else {
        const res = await axios.post(`${API}/process-text`, { text });
        sessionStorage.setItem('flashcards', JSON.stringify(res.data.flashcards));
        sessionStorage.setItem('graph', JSON.stringify(res.data.graph));
        sessionStorage.setItem('ordered_concepts', JSON.stringify(res.data.ordered_concepts));
      }
      navigate('/flashcards');
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start px-4 pt-16 pb-20">
      <BackgroundOrbs />

      <div className="relative z-10 w-full max-w-3xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 badge-blue mb-6 py-1.5 px-4 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            AI-Powered Learning Companion
          </div>

          <h1 className="text-5xl sm:text-6xl font-black mb-4 tracking-tight leading-none">
            <span className="text-white">Learn </span>
            <span className="text-gradient">Smarter</span>
            <br />
            <span className="text-white">with </span>
            <span className="text-gradient">CogniFuse</span>
          </h1>

          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            Paste your notes or upload a file. CogniFuse builds a knowledge graph,
            generates flashcards in prerequisite order, and adapts to your weak spots.
          </p>
        </div>

        {/* Main Input Card */}
        <div className="glass p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="font-semibold text-white">Your Study Material</h2>
          </div>

          {/* Text Area */}
          <textarea
            className="input-field h-48 resize-none mb-5 custom-scroll text-sm leading-relaxed"
            placeholder="Paste your notes, textbook excerpts, or any study material here...&#10;&#10;Example: 'Gradient descent is an optimization algorithm that iteratively adjusts parameters to minimize a loss function. Backpropagation uses gradient descent to train neural networks...'"
            value={text}
            onChange={(e) => { setText(e.target.value); setError(''); }}
            disabled={!!file || loading}
          />

          {/* Divider */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500 font-medium">OR UPLOAD A FILE</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
              dragOver
                ? 'border-brand-400 bg-brand-500/10'
                : file
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            } ${text ? 'opacity-40 pointer-events-none' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.bmp,.tiff,.webp"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files[0])}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-emerald-400">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  className="ml-auto text-gray-600 hover:text-red-400 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-2">📎</div>
                <p className="text-sm text-gray-400">
                  <span className="text-brand-400 font-medium">Click to upload</span> or drag & drop
                </p>
                <p className="text-xs text-gray-600 mt-1">PDF, PNG, JPG, JPEG supported</p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <span className="text-red-400 text-sm mt-0.5">⚠</span>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            className="btn-primary w-full mt-6 py-4 text-base"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Flashcards
              </>
            )}
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FeatureCard icon="🧠" title="Knowledge Graph" desc="Extracts concept relationships automatically" />
          <FeatureCard icon="📚" title="Smart Ordering" desc="Kahn's topological sort for optimal learning" />
          <FeatureCard icon="🎯" title="Adaptive Quiz" desc="Detects root cause of failures in real-time" />
          <FeatureCard icon="🗺️" title="Mind Map" desc="D3.js visual graph of all concepts" />
        </div>
      </div>
    </div>
  );
}
