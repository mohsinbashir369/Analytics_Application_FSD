import React, { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../api';

export default function Heatmap() {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [clicks, setClicks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [viewMode, setViewMode] = useState('dots'); // dots | density
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    api.getPages()
      .then(p => { setPages(p); if (p.length > 0) setSelectedPage(p[0]); })
      .catch(console.error)
      .finally(() => setPagesLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedPage) return;
    setLoading(true);
    api.getHeatmap(selectedPage)
      .then(setClicks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedPage]);

  const drawHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || clicks.length === 0) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Dark background
    ctx.fillStyle = '#12121a';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= W; x += W / 10) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += H / 8) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    if (viewMode === 'dots') {
      clicks.forEach(c => {
        const vw = c.viewport_width || 1440;
        const vh = c.viewport_height || 900;
        const px = (c.x / vw) * W;
        const py = (c.y / vh) * H;

        // Glow
        const grd = ctx.createRadialGradient(px, py, 0, px, py, 22);
        grd.addColorStop(0, 'rgba(124,110,255,0.4)');
        grd.addColorStop(1, 'rgba(124,110,255,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(px, py, 22, 0, Math.PI * 2);
        ctx.fill();

        // Dot
        ctx.fillStyle = 'rgba(168,154,255,0.85)';
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    } else {
      // Density grid (16x12 grid cells)
      const cols = 16; const rows = 12;
      const cellW = W / cols; const cellH = H / rows;
      const grid = Array.from({ length: rows }, () => new Array(cols).fill(0));

      clicks.forEach(c => {
        const vw = c.viewport_width || 1440;
        const vh = c.viewport_height || 900;
        const col = Math.min(Math.floor((c.x / vw) * cols), cols - 1);
        const row = Math.min(Math.floor((c.y / vh) * rows), rows - 1);
        if (col >= 0 && row >= 0) grid[row][col]++;
      });

      const maxVal = Math.max(...grid.flat(), 1);
      grid.forEach((row, ri) => {
        row.forEach((val, ci) => {
          if (val === 0) return;
          const intensity = val / maxVal;
          // Color: cold blue → warm purple → hot red
          let r, g, b;
          if (intensity < 0.5) {
            r = Math.round(intensity * 2 * 124); g = Math.round(intensity * 2 * 110); b = 255;
          } else {
            const t = (intensity - 0.5) * 2;
            r = Math.round(124 + t * 131); g = Math.round(110 - t * 110); b = Math.round(255 - t * 255);
          }
          ctx.fillStyle = `rgba(${r},${g},${b},${0.2 + intensity * 0.65})`;
          ctx.fillRect(ci * cellW, ri * cellH, cellW, cellH);
          if (val > 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.65)';
            ctx.font = `bold ${Math.max(9, Math.round(intensity * 14))}px Inter`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(val, ci * cellW + cellW / 2, ri * cellH + cellH / 2);
          }
        });
      });
    }
  }, [clicks, viewMode]);

  useEffect(() => {
    if (clicks.length > 0) drawHeatmap();
  }, [clicks, viewMode, drawHeatmap]);

  // Clear canvas when no clicks
  useEffect(() => {
    if (clicks.length === 0 && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.fillStyle = '#12121a';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [clicks]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Click Heatmap</h1>
        <p>Visualize where users click across your pages</p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Page URL
          </label>
          {pagesLoading ? (
            <div style={{ height: '38px', background: 'var(--bg-surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
          ) : (
            <select
              value={selectedPage}
              onChange={e => setSelectedPage(e.target.value)}
              style={{
                width: '100%', padding: '0.5rem 0.75rem',
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', color: 'var(--text-primary)',
                fontSize: '0.875rem', fontFamily: 'var(--font-mono)',
                outline: 'none',
              }}
            >
              {pages.length === 0 && <option value="">No pages tracked yet</option>}
              {pages.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            View Mode
          </label>
          <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {['dots', 'density'].map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                style={{
                  padding: '0.5rem 1rem', border: 'none', fontSize: '0.8rem', fontWeight: 500,
                  background: viewMode === m ? 'var(--accent-dim)' : 'transparent',
                  color: viewMode === m ? 'var(--accent-light)' : 'var(--text-secondary)',
                  transition: 'all 0.15s', textTransform: 'capitalize',
                }}
              >
                {m === 'dots' ? '● Dots' : '▦ Density'}
              </button>
            ))}
          </div>
        </div>

        {clicks.length > 0 && (
          <div style={{ alignSelf: 'flex-end' }}>
            <span className="chip chip-purple">{clicks.length} clicks</span>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="card" ref={containerRef}>
        <div className="card-header">
          <span className="card-title">
            {selectedPage ? <span className="mono" style={{ fontSize: '0.8rem' }}>{selectedPage}</span> : 'Select a page'}
          </span>
        </div>
        <div style={{ position: 'relative', background: '#12121a' }}>
          {loading && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'rgba(10,10,15,0.7)', zIndex: 2, borderRadius: '0 0 var(--radius-lg) var(--radius-lg)'
            }}>
              <div className="spinner" />
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={900}
            height={560}
            style={{ width: '100%', display: 'block', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}
          />
          {!loading && clicks.length === 0 && selectedPage && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              color: 'var(--text-muted)', pointerEvents: 'none'
            }}>
              <span style={{ fontSize: '2rem' }}>🖱️</span>
              <span>No click data for this page yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      {viewMode === 'density' && clicks.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Low</span>
          <div style={{ height: '8px', width: '160px', borderRadius: '99px', background: 'linear-gradient(to right, rgba(124,110,255,0.4), rgba(255,0,0,0.8))' }} />
          <span>High</span>
        </div>
      )}
    </div>
  );
}
