import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function Analytics() {
  const [streak, setStreak] = useState({ count: 0, last_active: null });
  const [mastery, setMastery] = useState({ average: 0, total_concepts: 0 });
  const [weakZones, setWeakZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [streakRes, masteryRes, weakRes] = await Promise.all([
          axios.get(`${API}/analytics/streak`),
          axios.get(`${API}/analytics/mastery`),
          axios.get(`${API}/analytics/weak-zones`)
        ]);

        setStreak(streakRes.data);
        setMastery(masteryRes.data);
        setWeakZones(weakRes.data);
      } catch (e) {
        console.error("Failed to load analytics", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="glass p-12 text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Learning Analytics</h1>
        <p className="text-gray-400">Track your progress, streaks, and identify areas for improvement.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Streak Card */}
        <div className="glass p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-7xl">🔥</span>
          </div>
          <p className="text-sm text-gray-400 font-medium tracking-wide uppercase mb-2">Study Streak</p>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-red-600">
              {streak.count}
            </span>
            <span className="text-gray-300 pb-1 font-medium">Days</span>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Last active: {streak.last_active || "Never"}
          </p>
        </div>

        {/* Mastery Card */}
        <div className="glass p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-7xl">🧠</span>
          </div>
          <p className="text-sm text-gray-400 font-medium tracking-wide uppercase mb-2">Overall Mastery</p>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-400 to-accent-500">
              {mastery.average}%
            </span>
          </div>
          
          <div className="mt-4 bg-gray-800/50 rounded-full h-2 w-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-1000" 
              style={{ width: `${mastery.average}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Across {mastery.total_concepts} extracted concepts
          </p>
        </div>
      </div>

      {/* Weak Zones powered by GNN */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold text-white">Targeted Weak Zones</h2>
          <div className="px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] uppercase font-bold tracking-wider">
            GNN Powered
          </div>
        </div>

        {weakZones.length === 0 ? (
          <div className="glass p-8 text-center rounded-xl">
            <span className="text-3xl mb-3 block">🎉</span>
            <p className="text-gray-300 font-medium">No weak zones detected yet!</p>
            <p className="text-gray-500 text-sm mt-1">Keep studying to build your knowledge graph.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {weakZones.slice(0, 6).map((zone, idx) => (
              <div key={idx} className="glass p-5 rounded-xl flex flex-col h-full border border-red-500/10 hover:border-red-500/30 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold">
                    #{idx + 1}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 uppercase tracking-wider block">Avg Mastery</span>
                    <span className="text-red-400 font-bold text-lg">{zone.avg_mastery}%</span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <p className="text-sm text-gray-300 font-medium leading-relaxed">
                    {zone.concepts.join(", ")}
                  </p>
                </div>

                <button 
                  onClick={() => navigate(`/quiz?concept=${encodeURIComponent(zone.concepts[0])}`)}
                  className="mt-5 w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors"
                >
                  Target Practice
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
