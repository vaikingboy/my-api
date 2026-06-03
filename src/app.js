'use strict';

const express = require('express');

const app = express();
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────

// GET /health
// Used by: CI smoke tests, Kubernetes probes, load balancers
app.get('/health', (_req, res) => {
  res.status(200).json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    version:   process.env.npm_package_version || 'unknown',
    uptime:    process.uptime(),
  });
});

// GET /users
// Returns a list of users
app.get('/users', (_req, res) => {
  res.status(200).json([
    { id: 1, name: 'Alice', role: 'admin',  email: 'alice@example.com' },
    { id: 2, name: 'Bob',   role: 'user',   email: 'bob@example.com'   },
    { id: 3, name: 'Carol', role: 'user',   email: 'carol@example.com' },
  ]);
});

// GET /users/:id
// Returns a single user by ID
app.get('/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const users = [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob',   role: 'user'  },
    { id: 3, name: 'Carol', role: 'user'  },
  ];
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.status(200).json(user);
});

// POST /users
// Creates a new user (in-memory, no persistence)
app.post('/users', (req, res) => {
  const { name, email, role = 'user' } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }
  const newUser = { id: Date.now(), name, email, role };
  res.status(201).json(newUser);
});

// ── Export and start ─────────────────────────────────────────────

// Export for tests — allows supertest to import without starting the server
module.exports = app;

// Only start the HTTP server when run directly (not when imported)
if (require.main === module) {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  app.listen(PORT, () => {
    console.log(`[server] Listening on http://localhost:${PORT}`);
  });
}