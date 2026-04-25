import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8000';

// Color based on mastery level
function masteryColor(mastery) {
  if (mastery >= 67) return '#10b981';  // green
  if (mastery >= 34) return '#f59e0b';  // yellow
  return '#ef4444';                      // red
}

function masteryLabel(m) {
  if (m >= 67) return { text: 'Mastered', cls: 'badge-green' };
  if (m >= 34) return { text: 'Learning', cls: 'badge-yellow' };
  return { text: 'Not Started', cls: 'badge-red' };
}

export default function MindMap() {
  const svgRef = useRef(null);
  const navigate = useNavigate();
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [selected, setSelected] = useState(null);
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dual-layer toggles
  const [showBase, setShowBase] = useState(true);
  const [showCurrent, setShowCurrent] = useState(true);


  // Load graph – prefer fresh data from API, fallback to sessionStorage
  useEffect(() => {
    const fetchGraph = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/graph`);
        if (res.data.nodes.length > 0) {
          setGraphData(res.data);
        } else {
          const stored = sessionStorage.getItem('graph');
          if (stored) setGraphData(JSON.parse(stored));
        }
      } catch {
        const stored = sessionStorage.getItem('graph');
        if (stored) setGraphData(JSON.parse(stored));
        else setError('Could not load graph data. Please upload notes first.');
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, []);

  const fetchSummary = useCallback(async (concept) => {
    setLoadingSummary(true);
    setSummary('');
    try {
      const res = await axios.post(`${API}/summary`, { concept });
      setSummary(res.data.summary);
    } catch {
      setSummary(`${concept} is a key concept in this knowledge graph.`);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const handleNodeClick = useCallback((node) => {
    setSelected(node);
    fetchSummary(node.id);
  }, [fetchSummary]);

  // D3 rendering
  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const container = svgRef.current.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight || 600;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Zoom behavior
    const g = svg.append('g');
    svg.call(
      d3.zoom()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => g.attr('transform', event.transform))
    );

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', 'rgba(255,255,255,0.25)');

    // Clone nodes/links for D3 mutation and filter based on toggles
    const filteredNodes = graphData.nodes.filter(n => 
      (n.type === 'base' && showBase) || (n.type === 'current' && showCurrent)
    );
    
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
    
    const nodes = filteredNodes.map((n) => ({ ...n }));
    const links = graphData.edges
      .filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
      .map((e) => ({
        ...e,
        source: e.source,
        target: e.target,
      }));


    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance((d) => d.predicted ? 200 : 140))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(55))
      // Add cluster force for semantic grouping
      .force('x', d3.forceX().strength(0.1).x(d => (d.cluster !== undefined ? ((d.cluster % 3) - 1) * 200 + (width/2) : width/2)))
      .force('y', d3.forceY().strength(0.1).y(d => (d.cluster !== undefined ? (Math.floor(d.cluster / 3) - 1) * 200 + (height/2) : height/2)));

    // Links
    const link = g.append('g').selectAll('line')
      .data(links)
      .join('line')
      .attr('class', 'mindmap-link')
      .attr('marker-end', 'url(#arrowhead)')
      .attr('stroke', (d) => d.predicted ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.1)') // Purple for predicted
      .attr('stroke-dasharray', (d) => d.predicted ? '5,5' : 'none');

    // Edge labels
    const edgeLabel = g.append('g').selectAll('text')
      .data(links)
      .join('text')
      .attr('class', 'mindmap-link-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', (d) => d.predicted ? 'rgba(168, 85, 247, 0.8)' : 'rgba(255, 255, 255, 0.4)')
      .text((d) => d.relation || '');

    // Node groups
    const node = g.append('g').selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'mindmap-node')
      .call(
        d3.drag()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        handleNodeClick(d);
        // Highlight
        node.selectAll('circle')
          .attr('stroke', (n) => n.id === d.id ? '#fff' : (n.type === 'base' ? 'rgba(124, 58, 237, 0.4)' : 'rgba(0,0,0,0.4)'))
          .attr('stroke-width', (n) => n.id === d.id ? 3 : 1.5);
      });

    // Circles
    node.append('circle')
      .attr('r', (d) => d.type === 'base' ? 42 : 38)
      .attr('fill', (d) => masteryColor(d.mastery))
      .attr('stroke', (d) => d.type === 'base' ? 'rgba(124, 58, 237, 0.6)' : 'rgba(0,0,0,0.4)')
      .attr('stroke-width', (d) => d.type === 'base' ? 4 : 1.5)
      .style('filter', (d) => d.type === 'base' ? 'drop-shadow(0 0 8px rgba(124, 58, 237, 0.4))' : 'none');

    // Text labels
    node.append('text')
      .attr('dy', 36)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.90)')
      .attr('font-size', 11)
      .attr('font-weight', 600)
      .attr('font-family', 'Inter, sans-serif')
      .text((d) => d.id.length > 14 ? d.id.slice(0, 14) + '…' : d.id);

    // Mastery % inside circle
    node.append('text')
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.95)')
      .attr('font-size', 9)
      .attr('font-weight', 700)
      .attr('font-family', 'Inter, sans-serif')
      .text((d) => `${Math.round(d.mastery)}%`);

    // Tick update
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      edgeLabel
        .attr('x', (d) => (d.source.x + d.target.x) / 2)
        .attr('y', (d) => (d.source.y + d.target.y) / 2);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [graphData, handleNodeClick, showBase, showCurrent]);

  const handleReset = async () => {
    if (window.confirm('This will clear your entire learning history. Continue?')) {
      try {
        await axios.post(`${API}/reset`);
        setGraphData({ nodes: [], edges: [] });
        sessionStorage.clear();
        navigate('/');
      } catch (err) {
        alert('Reset failed.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="glass p-12 text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (error || graphData.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 px-4">
        <div className="glass p-12 text-center max-w-md">
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="text-xl font-semibold text-white mb-3">No Graph Data</h2>
          <p className="text-gray-400 text-sm mb-6">{error || 'Generate flashcards first to build the knowledge graph.'}</p>
          <button className="btn-primary" onClick={() => navigate('/')}>← Upload Notes</button>
        </div>
      </div>
    );
  }

  const nodeCount = graphData.nodes.length;
  const edgeCount = graphData.edges.length;
  const avgMastery = nodeCount > 0
    ? Math.round(graphData.nodes.reduce((s, n) => s + n.mastery, 0) / nodeCount)
    : 0;

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-white/5 bg-black/30 backdrop-blur-xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/5">
          <h2 className="font-bold text-white text-lg">Mind Map</h2>
          <p className="text-xs text-gray-500 mt-0.5">Click any node to explore</p>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-white/5 grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-xl font-bold text-white">{nodeCount}</p>
            <p className="text-xs text-gray-500">Concepts</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">{edgeCount}</p>
            <p className="text-xs text-gray-500">Relations</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">{avgMastery}%</p>
            <p className="text-xs text-gray-500">Avg Mastery</p>
          </div>
        </div>

        {/* Legend */}
        <div className="p-4 border-b border-white/5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2.5">Mastery Legend</p>
          <div className="space-y-1.5">
            {[
              { color: '#ef4444', label: 'Not Started', range: '0–33%' },
              { color: '#f59e0b', label: 'Learning', range: '34–66%' },
              { color: '#10b981', label: 'Mastered', range: '67–100%' },
            ].map(({ color, label, range }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-300 flex-1">{label}</span>
                <span className="text-xs text-gray-600">{range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected node info */}
        <div className="flex-1 p-4 overflow-y-auto custom-scroll">
          {selected ? (
            <div>
              <div className="flex items-start gap-2 mb-3">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: masteryColor(selected.mastery) }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm leading-tight">{selected.id}</h3>
                  <div className={`${masteryLabel(selected.mastery).cls} mt-1 text-xs`}>
                    {masteryLabel(selected.mastery).text}
                  </div>
                </div>
              </div>

              {/* Mastery bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Mastery</span>
                  <span className="text-white font-medium">{Math.round(selected.mastery)}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${selected.mastery}%`,
                      background: `linear-gradient(90deg, ${masteryColor(selected.mastery)}, ${masteryColor(selected.mastery)}99)`
                    }}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="glass p-3 mb-4">
                <p className="text-xs text-gray-500 font-medium mb-2">AI Summary</p>
                {loadingSummary ? (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 border border-brand-400/50 border-t-brand-400 rounded-full animate-spin" />
                    <span className="text-xs text-gray-500">Generating...</span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-300 leading-relaxed">{summary}</p>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  className="btn-primary w-full py-2.5 text-sm"
                  onClick={() => navigate(`/quiz?concept=${encodeURIComponent(selected.id)}`)}
                >
                  🎯 Quiz on this
                </button>
                <button
                  className="btn-secondary w-full py-2.5 text-sm"
                  onClick={() => navigate('/flashcards')}
                >
                  📚 View Flashcard
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center mt-8">
              <div className="text-3xl mb-3">👆</div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Click on any node in the graph to see its summary and options.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* D3 Canvas */}
      <div className="flex-1 relative overflow-hidden bg-gray-950">
        {/* Zoom hint & Toggles */}
        <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowBase(!showBase)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                showBase 
                  ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/20' 
                  : 'bg-gray-900/80 border-white/5 text-gray-500'
              }`}
            >
              Foundations {showBase ? 'ON' : 'OFF'}
            </button>
            <button 
              onClick={() => setShowCurrent(!showCurrent)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                showCurrent 
                  ? 'bg-brand-600 border-brand-400 text-white shadow-lg shadow-brand-500/20' 
                  : 'bg-gray-900/80 border-white/5 text-gray-500'
              }`}
            >
              Current Topics {showCurrent ? 'ON' : 'OFF'}
            </button>
            <button 
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-950/40 border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all"
            >
              Reset Session
            </button>
          </div>

          <div className="glass px-3 py-1.5 text-xs text-gray-500 hidden md:block">
            Scroll to zoom · Drag to pan · Click node
          </div>
        </div>

        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}
