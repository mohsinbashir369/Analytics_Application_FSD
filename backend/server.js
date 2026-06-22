require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Event = require('./models/Event');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/analytics';

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'null'], 
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to Local MongoDB!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ── POST /api/events  ── Receive and store events
app.post('/api/events', async (req, res) => {
  try {
    const { session_id, event_type, page_url, timestamp, x, y, user_agent, viewport_width, viewport_height } = req.body;

    if (!session_id || !event_type || !page_url || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const event = new Event({
      session_id,
      event_type,
      page_url,
      timestamp: new Date(timestamp),
      x: x ?? null,
      y: y ?? null,
      user_agent: user_agent || '',
      viewport_width: viewport_width ?? null,
      viewport_height: viewport_height ?? null,
    });

    await event.save();
    res.status(201).json({ success: true, id: event._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/events/batch  ── Receive multiple events at once
app.post('/api/events/batch', async (req, res) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'events must be a non-empty array' });
    }

    const docs = events.map(e => ({
      session_id: e.session_id,
      event_type: e.event_type,
      page_url: e.page_url,
      timestamp: new Date(e.timestamp),
      x: e.x ?? null,
      y: e.y ?? null,
      user_agent: e.user_agent || '',
      viewport_width: e.viewport_width ?? null,
      viewport_height: e.viewport_height ?? null,
    }));

    await Event.insertMany(docs);
    res.status(201).json({ success: true, count: docs.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/sessions  ── List all sessions with event counts
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: '$session_id',
          total_events: { $sum: 1 },
          page_views: { $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] } },
          clicks: { $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] } },
          first_seen: { $min: '$timestamp' },
          last_seen: { $max: '$timestamp' },
          pages_visited: { $addToSet: '$page_url' },
        }
      },
      { $sort: { last_seen: -1 } },
      {
        $project: {
          session_id: '$_id',
          total_events: 1,
          page_views: 1,
          clicks: 1,
          first_seen: 1,
          last_seen: 1,
          pages_visited: { $size: '$pages_visited' },
          duration_seconds: {
            $divide: [{ $subtract: ['$last_seen', '$first_seen'] }, 1000]
          }
        }
      }
    ]);

    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/sessions/:sessionId  ── Events for a specific session
app.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    const events = await Event.find({ session_id: req.params.sessionId })
      .sort({ timestamp: 1 })
      .lean();
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/heatmap  ── Click data for a page URL
app.get('/api/heatmap', async (req, res) => {
  try {
    const { page_url } = req.query;
    if (!page_url) return res.status(400).json({ error: 'page_url query param required' });

    const clicks = await Event.find({
      page_url,
      event_type: 'click',
      x: { $ne: null },
      y: { $ne: null }
    })
    .select('x y timestamp session_id viewport_width viewport_height -_id')
    .lean();

    res.json(clicks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/pages  ── List all tracked page URLs
app.get('/api/pages', async (req, res) => {
  try {
    const pages = await Event.distinct('page_url');
    res.json(pages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/stats  ── Overall stats
app.get('/api/stats', async (req, res) => {
  try {
    const [totals] = await Event.aggregate([
      {
        $group: {
          _id: null,
          total_events: { $sum: 1 },
          total_sessions: { $addToSet: '$session_id' },
          total_clicks: { $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] } },
          total_pageviews: { $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] } },
        }
      },
      {
        $project: {
          total_events: 1,
          total_sessions: { $size: '$total_sessions' },
          total_clicks: 1,
          total_pageviews: 1,
        }
      }
    ]);
    res.json(totals || { total_events: 0, total_sessions: 0, total_clicks: 0, total_pageviews: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
