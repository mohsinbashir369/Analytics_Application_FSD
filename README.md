# CausalFunnel Analytics

A full-stack user analytics application that tracks session events (page views & clicks) and displays them in a real-time dashboard with heatmap visualization.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Canvas API |
| Backend | Node.js, Express 4 |
| Database | MongoDB (Mongoose ODM) |
| Tracker | Vanilla JS (zero dependencies) |

---
## 🚀 Live Deployments

* **📊 Analytics Dashboard:** [analytics-application-fsd.vercel.app](https://analytics-application-fsd.vercel.app)
* **⚡ Live Demo Storefront:** [analytics-application-fsd.vercel.app/demo.html](https://analytics-application-fsd.vercel.app/demo.html)
* **⚙️ Backend API instance:** [causalfunnel-backend-lq0x.onrender.com](https://causalfunnel-backend-lq0x.onrender.com)

---
## Features

- **Event Tracking Script** — drop `tracker.js` into any webpage; tracks `page_view` and `click` events with session ID, coordinates, viewport size, and user-agent
- **Batch API** — events are queued and flushed every 2 s (or on page unload via `sendBeacon`)
- **Sessions View** — lists all sessions with event counts, duration, and pages visited; clicking a row shows the full ordered user journey timeline
- **Heatmap View** — renders click positions on a canvas overlay with two modes: **dots** (per-click glowing points) and **density** (grid-based heat map with intensity coloring)
- **Overview Dashboard** — live stats (total sessions, events, page views, clicks, avg events/session) + event distribution bar

---

## Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (or a MongoDB Atlas URI)


### 1. Clone & install

```bash
git clone [https://github.com/mohsinbashir369/Analytics_Application_FSD.git](https://github.com/mohsinbashir369/Analytics_Application_FSD.git)
cd Analytics_Application_FSD
```

### 2. Start the backend

```bash
cd backend
cp .env.example .env          # edit MONGODB_URI if needed
npm install
npm start                     # runs on http://localhost:5000
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm start          # runs on http://localhost:3000
```

### 4. Open the demo page

Open `tracker/demo.html` directly in your browser (file://) or serve it:

```bash
cd tracker
npx serve .                   # then open http://localhost:3001/demo.html
```

Click around the demo page — events will appear in the dashboard within a few seconds.

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/events` | Track a single event |
| POST | `/api/events/batch` | Track multiple events at once |
| GET | `/api/sessions` | List all sessions with aggregated stats |
| GET | `/api/sessions/:id` | All events for a session (ordered) |
| GET | `/api/heatmap?page_url=` | Click coordinates for a page |
| GET | `/api/pages` | Distinct tracked page URLs |
| GET | `/api/stats` | Overall totals |

### Event payload

```json
{
  "session_id": "uuid-v4",
  "event_type": "page_view | click",
  "page_url": "https://example.com/page",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "x": 320,
  "y": 450,
  "user_agent": "Mozilla/5.0 ...",
  "viewport_width": 1440,
  "viewport_height": 900
}
```

---

## Adding the Tracker to Your Own Page

```html
<script src="path/to/tracker.js" data-api="http://localhost:5000"></script>
```

The script automatically:
- Generates and persists a `session_id` (localStorage → cookie fallback)
- Fires `page_view` on load and on SPA navigation (popstate / hashchange)
- Fires `click` on every document click with `x`/`y` coordinates
- Batches events and flushes every 2 s or on page unload

---

## Assumptions & Trade-offs

- **No authentication** — endpoints are open; production use should add API key validation or JWT auth
- **Coordinates are viewport-relative** — click positions are stored as raw `clientX/clientY` plus percentage values; the heatmap normalises them back using the stored `viewport_width/height`
- **SPA support** — `pushState` navigation is not auto-detected (no monkey-patching); `window.CausalFunnel.track('page_view')` can be called manually, as shown in demo.html
- **Single-process** — the backend is a single Express process; for scale, add a Redis queue and worker
- **Canvas heatmap** — built with the Canvas 2D API (no third-party heatmap lib) to keep dependencies minimal

---

## Project Structure

```
analytics-app/
├── backend/
│   ├── models/Event.js      # Mongoose schema
│   ├── server.js            # Express app + all routes
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.js  # Overview stats
│   │   │   ├── Sessions.js   # Session list + journey view
│   │   │   └── Heatmap.js    # Canvas heatmap
│   │   ├── api.js            # Fetch helpers
│   │   ├── App.js            # Sidebar + routing
│   │   ├── App.css           # Design system
│   │   └── index.css         # CSS variables
│   └── package.json
└── tracker/
    ├── tracker.js            # Tracking script (drop-in)
    └── demo.html             # Test webpage
```
