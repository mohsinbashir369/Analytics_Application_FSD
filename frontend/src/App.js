import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Sessions from './components/Sessions';
import Heatmap from './components/Heatmap';
import './App.css';

function Sidebar() {
  const links = [
    { to: '/', label: 'Overview', icon: '▣' },
    { to: '/sessions', label: 'Sessions', icon: '⊡' },
    { to: '/heatmap', label: 'Heatmap', icon: '◉' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">⚡</span>
        <span className="logo-text">CausalFunnel</span>
      </div>
      <nav className="sidebar-nav">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="status-dot"></div>
        <span>Tracking live</span>
      </div>
    </aside>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/heatmap" element={<Heatmap />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
