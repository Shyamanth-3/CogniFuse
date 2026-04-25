import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Flashcards() {
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [orderedConcepts, setOrderedConcepts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = sessionStorage.getItem('flashcards');
    const concepts = sessionStorage.getItem('ordered_concepts');
    if (stored) setFlashcards(JSON.parse(stored));
    if (concepts) setOrderedConcepts(JSON.parse(concepts));
  }, []);

  const card = flashcards[currentIndex];
  const total = flashcards.length;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  const goNext = () => {
    setFlipped(false);
    setTimeout(() => setCurrentIndex((i) => Math.min(i + 1, total - 1)), 150);
  };

  const goPrev = () => {
    setFlipped(false);
    setTimeout(() => setCurrentIndex((i) => Math.max(i - 1, 0)), 150);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === ' ') { e.preventDefault(); setFlipped((f) => !f); }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 px-4">
        <div className="glass p-12 text-center max-w-md">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-xl font-semibold text-white mb-3">No Flashcards Yet</h2>
          <p className="text-gray-400 text-sm mb-6">Generate flashcards by uploading your study material first.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            ← Go to Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-8 pb-20">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Flashcards</h1>
            <p className="text-sm text-gray-500 mt-0.5">In topological prerequisite order</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm" onClick={() => navigate('/mindmap')}>
              🗺️ Mind Map
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Card {currentIndex + 1} of {total}</span>
            <span className="text-brand-400 font-medium">{Math.round(progress)}% complete</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          {/* Concept trail */}
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {orderedConcepts.slice(0, 12).map((c, i) => (
              <button
                key={i}
                onClick={() => { setFlipped(false); setCurrentIndex(i); }}
                className={`text-xs px-2.5 py-1 rounded-full transition-all duration-200 font-medium ${
                  i === currentIndex
                    ? 'bg-brand-500 text-white'
                    : i < currentIndex
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/5 text-gray-500 border border-white/10 hover:border-white/20'
                }`}
              >
                {c.length > 12 ? c.slice(0, 12) + '…' : c}
              </button>
            ))}
            {orderedConcepts.length > 12 && (
              <span className="text-xs text-gray-600 py-1">+{orderedConcepts.length - 12} more</span>
            )}
          </div>
        </div>

        {/* Flip Card */}
        <div
          className={`flip-card w-full h-80 mb-6 ${flipped ? 'flipped' : ''}`}
          onClick={() => setFlipped((f) => !f)}
        >
          <div className="flip-card-inner w-full h-full">
            {/* Front */}
            <div
              className="flip-card-front text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(31,79,255,0.12) 0%, rgba(124,58,237,0.12) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)'
              }}
            >
              <div className="badge-blue mb-4 text-xs">
                {card?.concept}
              </div>
              <p className="text-xl font-semibold text-white leading-relaxed max-w-md">{card?.front}</p>
              <p className="text-xs text-gray-600 mt-6">Click to reveal answer · Space</p>
            </div>

            {/* Back */}
            <div
              className="flip-card-back text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(31,79,255,0.10) 100%)',
                border: '1px solid rgba(124,58,237,0.25)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 30px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.08)'
              }}
            >
              <div className="badge-purple mb-4 text-xs">Answer</div>
              <p className="text-base text-gray-200 leading-relaxed max-w-md">{card?.back}</p>
              <p className="text-xs text-gray-600 mt-6">Click to flip back · Space</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            className="btn-secondary flex-1 py-3 disabled:opacity-30"
            onClick={goPrev}
            disabled={currentIndex === 0}
          >
            ← Previous
          </button>

          <button
            className="btn-primary flex-1 py-3"
            onClick={() => navigate(`/quiz?concept=${encodeURIComponent(card?.concept)}`)}
          >
            🎯 Take Quiz
          </button>

          <button
            className="btn-secondary flex-1 py-3 disabled:opacity-30"
            onClick={goNext}
            disabled={currentIndex === total - 1}
          >
            Next →
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
          <span>← → Navigate</span>
          <span className="w-px h-3 bg-gray-700" />
          <span>Space Flip</span>
          <span className="w-px h-3 bg-gray-700" />
          <span>Click card to flip</span>
        </div>
      </div>
    </div>
  );
}
