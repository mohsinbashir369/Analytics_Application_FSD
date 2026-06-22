import React, { useEffect, useState } from 'react';
import { api } from '../api';

function formatNumber(n) {
  if (n == null) return '0';
  return n.toLocaleString();
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Core data pulling utility function
  const fetchFreshData = async () => {
    try {
      const [s, sess] = await Promise.all([api.getStats(), api.getSessions()]);
      setStats(s);
      setSessions(sess.slice(0, 5));
    } catch (error) {
      console.error("Polling sync failure:", error);
    }
  };

  // 2. Automated background live tracker polling
  useEffect(() => {
    // Initial load execution
    fetchFreshData().finally(() => setLoading(false));

    // Setup an interval to execute background re-fetches every 1500ms
    const liveUpdateInterval = setInterval(() => {
      fetchFreshData();
    }, 1500);

    // Dynamic garbage collection cleanup when sidebar tab switches
    return () => clearInterval(liveUpdateInterval);
  }, []);

  // Full screen spinner block handles only the first loading visual mount
  if (loading && !stats) return (
    <div className="page">
      <div className="loading-state"><div className="spinner" /></div>
    </div>
  );

  const avgEvents = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + (s.total_events || 0), 0) / sessions.length)
    : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Analytics Overview</h1>
        <p>Real-time session and event tracking across all pages</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Sessions</div>
          <div className="stat-value stat-accent">{formatNumber(stats?.total_sessions)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Events</div>
          <div className="stat-value stat-blue">{formatNumber(stats?.total_events)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Page Views</div>
          <div className="stat-value stat-green">{formatNumber(stats?.total_pageviews)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Clicks</div>
          <div className="stat-value stat-yellow">{formatNumber(stats?.total_clicks)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Events / Session</div>
          <div className="stat-value">{avgEvents}</div>
        </div>
      </div>

      {/* Event breakdown bar */}
      {stats && stats.total_events > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <span className="card-title">Event Distribution</span>
          </div>
          <div style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--green)' }}>● Page Views: {stats.total_pageviews}</span>
              <span style={{ color: 'var(--yellow)' }}>● Clicks: {stats.total_clicks}</span>
            </div>
            <div style={{ height: '10px', borderRadius: '99px', background: 'var(--bg-elevated)', overflow: 'hidden', display: 'flex' }}>
              <div style={{
                width: `${(stats.total_pageviews / stats.total_events) * 100}%`,
                background: 'var(--green)',
                borderRadius: '99px 0 0 99px',
                transition: 'width 0.6s ease',
              }} />
              <div style={{
                width: `${(stats.total_clicks / stats.total_events) * 100}%`,
                background: 'var(--yellow)',
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Recent sessions */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Sessions</span>
          <a href="/sessions" style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>View all →</a>
        </div>
        {sessions.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '1.5rem' }}>📭</span>
            <span>No sessions yet. Add the tracker to a webpage to start collecting data.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Events</th>
                  <th>Pages</th>
                  <th>Duration</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.session_id} onClick={() => window.location.href = `/sessions?id=${s.session_id}`}>
                    <td><span className="mono">{s.session_id?.slice(0, 18)}…</span></td>
                    <td><span className="chip chip-purple">{s.total_events}</span></td>
                    <td><span className="chip chip-blue">{s.pages_visited}</span></td>
                    <td style={{ color: 'var(--text-primary)' }}>
                      {s.duration_seconds ? `${Math.round(s.duration_seconds)}s` : '—'}
                    </td>
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