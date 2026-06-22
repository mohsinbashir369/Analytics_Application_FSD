import React, { useEffect, useState } from 'react';
import { api } from '../api';

function EventIcon({ type }) {
  if (type === 'page_view') return <span title="Page View" style={{ color: 'var(--green)' }}>◈</span>;
  if (type === 'click') return <span title="Click" style={{ color: 'var(--yellow)' }}>⊕</span>;
  return <span>•</span>;
}

function SessionDetail({ sessionId, onBack }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSession(sessionId)
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  return (
    <div className="page">
      <button className="btn-back" onClick={onBack}>← Back to Sessions</button>
      <div className="page-header">
        <h1>User Journey</h1>
        <p className="mono">{sessionId}</p>
      </div>

      <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Events</div>
          <div className="stat-value stat-accent">{events.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Page Views</div>
          <div className="stat-value stat-green">{events.filter(e => e.event_type === 'page_view').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Clicks</div>
          <div className="stat-value stat-yellow">{events.filter(e => e.event_type === 'click').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Duration</div>
          <div className="stat-value">
            {events.length >= 2
              ? `${Math.round((new Date(events[events.length - 1].timestamp) - new Date(events[0].timestamp)) / 1000)}s`
              : '—'}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Event Timeline</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{events.length} events</span>
        </div>
        <div style={{ padding: '1.25rem 1.5rem' }}>
          {events.length === 0 ? (
            <div className="empty-state">No events found.</div>
          ) : (
            <div className="timeline">
              {events.map((e, i) => (
                <div key={e._id || i} className="timeline-item">
                  <div className="timeline-line">
                    <div className="timeline-dot">
                      <EventIcon type={e.event_type} />
                    </div>
                    {i < events.length - 1 && <div className="timeline-connector" />}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-top">
                      <span className={`chip ${e.event_type === 'page_view' ? 'chip-green' : 'chip-yellow'}`}>
                        {e.event_type === 'page_view' ? 'Page View' : 'Click'}
                      </span>
                      <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(e.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="timeline-url">{e.page_url}</div>
                    {e.event_type === 'click' && e.x != null && (
                      <div className="timeline-meta">
                        Clicked at ({Math.round(e.x)}, {Math.round(e.y)}) px
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .timeline { display: flex; flex-direction: column; gap: 0; }
        .timeline-item { display: flex; gap: 1rem; }
        .timeline-line { display: flex; flex-direction: column; align-items: center; width: 24px; flex-shrink: 0; }
        .timeline-dot { width: 24px; height: 24px; border-radius: 50%; background: var(--bg-elevated); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0; }
        .timeline-connector { flex: 1; width: 1px; background: var(--border); min-height: 16px; }
        .timeline-content { flex: 1; padding-bottom: 1.25rem; }
        .timeline-top { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem; }
        .timeline-url { font-size: 0.82rem; color: var(--text-primary); word-break: break-all; }
        .timeline-meta { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem; font-family: var(--font-mono); }
      `}</style>
    </div>
  );
}

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    // Support ?id= query param
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) setSelected(id);

    api.getSessions()
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (selected) return <SessionDetail sessionId={selected} onBack={() => setSelected(null)} />;

  if (loading) return (
    <div className="page">
      <div className="loading-state"><div className="spinner" /></div>
    </div>
  );

  function formatDuration(s) {
    if (!s || s < 0) return '—';
    if (s < 60) return `${Math.round(s)}s`;
    return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Sessions</h1>
        <p>{sessions.length} sessions tracked · Click a row to view the user journey</p>
      </div>

      <div className="card">
        {sessions.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '2rem' }}>📭</span>
            <span>No sessions yet. Start the tracker to collect data.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Total Events</th>
                  <th>Page Views</th>
                  <th>Clicks</th>
                  <th>Pages Visited</th>
                  <th>Duration</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.session_id} onClick={() => setSelected(s.session_id)}>
                    <td><span className="mono">{s.session_id?.slice(0, 20)}…</span></td>
                    <td><span className="chip chip-purple">{s.total_events}</span></td>
                    <td><span className="chip chip-green">{s.page_views}</span></td>
                    <td><span className="chip chip-yellow">{s.clicks}</span></td>
                    <td><span className="chip chip-blue">{s.pages_visited}</span></td>
                    <td style={{ color: 'var(--text-primary)' }}>{formatDuration(s.duration_seconds)}</td>
                    <td>{s.last_seen ? new Date(s.last_seen).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
