import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function Quiz() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [concept, setConcept] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mutatedCard, setMutatedCard] = useState(null);
  const [failureCount, setFailureCount] = useState(0);
  const [masteryScore, setMasteryScore] = useState(0);
  const [error, setError] = useState('');

  // Mistake Analysis
  const [analysis, setAnalysis] = useState(null);
  const [analyzingMistake, setAnalyzingMistake] = useState(false);


  // Get all concepts from session
  const orderedConcepts = JSON.parse(sessionStorage.getItem('ordered_concepts') || '[]');

  const fetchQuiz = useCallback(async (c) => {
    setLoading(true);
    setQuiz(null);
    setSelected(null);
    setAnswered(false);
    setIsCorrect(null);
    setMutatedCard(null);
    setAnalysis(null);
    setError('');

    try {
      const res = await axios.post(`${API}/generate-quiz`, { concept: c });
      setQuiz(res.data);
    } catch (err) {
      setError('Failed to load quiz. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const c = searchParams.get('concept') || orderedConcepts[0] || '';
    setConcept(c);
    if (c) fetchQuiz(c);
    setFailureCount(0);
    setMasteryScore(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleAnswer = async (option) => {
    if (answered || submitting) return;
    setSelected(option);
    setAnswered(true);
    const correct = option === quiz.answer;
    setIsCorrect(correct);
    setSubmitting(true);

    const newFailCount = correct ? 0 : failureCount + 1;
    if (!correct) setFailureCount(newFailCount);

    const score = correct ? 25 : 0;
    const newMastery = correct
      ? Math.min(100, masteryScore + score)
      : Math.max(0, masteryScore - 10);
    setMasteryScore(newMastery);

    try {
      const res = await axios.post(`${API}/submit-answer`, {
        concept,
        correct,
        score: newMastery,
      });
      if (res.data.mutated_card) setMutatedCard(res.data.mutated_card);

      // AI Mistake Analysis on failure
      if (!correct) {
        setAnalyzingMistake(true);
        try {
          const analysisRes = await axios.post(`${API}/analyze-mistake`, {
            question: quiz.question,
            user_answer: option,
            concept: concept
          });
          setAnalysis(analysisRes.data);
        } catch (e) {
          console.error("Analysis error", e);
        } finally {
          setAnalyzingMistake(false);
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };


  const handleNextConcept = () => {
    const idx = orderedConcepts.indexOf(concept);
    const next = orderedConcepts[idx + 1];
    if (next) navigate(`/quiz?concept=${encodeURIComponent(next)}`);
    else navigate('/flashcards');
  };

  const handleRetry = () => {
    fetchQuiz(concept);
    setFailureCount(0);
  };

  const getOptionClass = (option) => {
    if (!answered) return 'option-btn';
    if (option === quiz.answer) return 'option-btn correct';
    if (option === selected && !isCorrect) return 'option-btn wrong';
    return 'option-btn opacity-40';
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-8 pb-20">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Quiz</h1>
            <p className="text-sm text-gray-500 mt-0.5">Adaptive assessment</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost text-xs text-red-400 hover:text-red-300"
              onClick={async () => {
                if (window.confirm('Reset learning history?')) {
                  await axios.post(`${API}/reset`);
                  sessionStorage.clear();
                  navigate('/');
                }
              }}
            >
              Reset Session
            </button>
            <button className="btn-ghost text-sm" onClick={() => navigate('/flashcards')}>
              ← Back to Flashcards
            </button>
          </div>
        </div>

        {/* Concept selector */}
        {orderedConcepts.length > 0 && (
          <div className="glass p-4 mb-5">
            <p className="text-xs text-gray-500 mb-2.5 font-medium uppercase tracking-wider">Select Concept</p>
            <div className="flex flex-wrap gap-1.5">
              {orderedConcepts.map((c, i) => (
                <button
                  key={i}
                  onClick={() => { setConcept(c); fetchQuiz(c); setFailureCount(0); setMasteryScore(0); }}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 ${c === concept
                    ? 'bg-brand-500 text-white'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:border-brand-400/40 hover:text-white'
                    }`}
                >
                  {c.length > 16 ? c.slice(0, 16) + '…' : c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current concept badge */}
        {concept && (
          <div className="flex items-center gap-3 mb-5">
            <div className="badge-blue py-1.5 px-4">
              <span className="mr-1">📖</span> {concept}
            </div>
            {masteryScore > 0 && (
              <div className="badge-green py-1.5 px-3">
                Mastery: {masteryScore}%
              </div>
            )}
            {failureCount > 0 && (
              <div className="badge-red py-1.5 px-3">
                ⚠ Failed {failureCount}×
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass p-6 text-center mb-5">
            <p className="text-red-400 mb-4">{error}</p>
            <button className="btn-secondary" onClick={() => fetchQuiz(concept)}>Retry</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="glass p-12 text-center">
            <div className="spinner mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Generating quiz question...</p>
          </div>
        )}

        {/* Quiz card */}
        {quiz && !loading && (
          <div className="glass p-8">
            <div className="flex items-start gap-3 mb-7">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-brand-400 text-sm font-bold">Q</span>
              </div>
              <p className="text-lg font-semibold text-white leading-relaxed">{quiz.question}</p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {quiz.options.map((opt, i) => (
                <button
                  key={i}
                  className={getOptionClass(opt)}
                  onClick={() => handleAnswer(opt)}
                  disabled={answered}
                >
                  <span className="inline-flex w-6 h-6 rounded-md bg-white/10 items-center justify-center text-xs font-bold mr-3 flex-shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>

            {/* Result feedback */}
            {answered && (
              <div className="space-y-4">
                {/* Correct / Wrong */}
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isCorrect
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
                  }`}>
                  <span className="text-xl">{isCorrect ? '✅' : '❌'}</span>
                  <div>
                    <p className={`font-semibold text-sm ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isCorrect ? 'Correct! Well done.' : 'Incorrect.'}
                    </p>
                    {!isCorrect && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Correct answer: <span className="text-emerald-400 font-medium">{quiz.answer}</span>
                      </p>
                    )}
                  </div>
                </div>


                {/* AI Mistake Analysis */}
                {!isCorrect && (analysis || analyzingMistake) && (
                  <div className="px-5 py-4 rounded-xl bg-orange-500/10 border border-orange-500/25">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-orange-400 text-lg">🧠</span>
                      <p className="text-orange-400 font-semibold text-sm text-gradient">AI Mistake Diagnosis</p>
                    </div>
                    {analyzingMistake ? (
                      <div className="flex items-center gap-2 py-2">
                        <span className="w-4 h-4 border border-orange-400/50 border-t-orange-400 rounded-full animate-spin" />
                        <span className="text-xs text-gray-500">Analyzing your response...</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-white mb-1.5 leading-relaxed">{analysis.analysis}</p>
                        <p className="text-xs text-gray-400 italic mb-4">Suggestion: {analysis.suggestion}</p>

                        {analysis.foundational_concept && (
                          <div className="pt-3 border-t border-orange-500/10">
                            <p className="text-xs text-orange-300 font-medium mb-3 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                              Foundation Gap Identified
                            </p>
                            <button
                              className="w-full py-2.5 bg-orange-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                              onClick={() => navigate(`/quiz?concept=${encodeURIComponent(analysis.foundational_concept)}`)}
                            >
                              🚀 Start Learning Foundation: "{analysis.foundational_concept}"
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}


                {/* Mutated Card */}
                {mutatedCard && (
                  <div className="px-5 py-4 rounded-xl bg-accent-500/10 border border-accent-500/25">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-accent-400 text-lg">🔄</span>
                      <p className="text-accent-400 font-semibold text-sm">New Explanation — Different Angle</p>
                      <span className="badge-purple text-xs ml-auto">AI Adapted</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium mb-1">{mutatedCard.front}</p>
                    <p className="text-sm text-gray-200 leading-relaxed">{mutatedCard.back}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-1">
                  {isCorrect ? (
                    <button className="btn-primary flex-1 py-3" onClick={handleNextConcept}>
                      Next Concept →
                    </button>
                  ) : (
                    <>
                      <button className="btn-secondary flex-1 py-3" onClick={handleRetry}>
                        🔁 Try Again
                      </button>
                      <button className="btn-primary flex-1 py-3" onClick={handleNextConcept}>
                        Skip →
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
