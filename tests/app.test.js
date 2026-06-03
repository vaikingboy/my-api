'use strict';

const request = require('supertest');
const app     = require('../src/app');

// ── GET /health ──────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns HTTP 200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
  });

  it('returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.body.status).toBe('ok');
  });

  it('returns a valid ISO timestamp', async () => {
    const res = await request(app).get('/health');
    expect(res.body.timestamp).toBeDefined();
    expect(new Date(res.body.timestamp).getTime()).not.toBeNaN();
  });

  it('returns uptime as a number', async () => {
    const res = await request(app).get('/health');
    expect(typeof res.body.uptime).toBe('number');
  });
});

// ── GET /users ───────────────────────────────────────────────────
describe('GET /users', () => {
  it('returns HTTP 200', async () => {
    const res = await request(app).get('/users');
    expect(res.statusCode).toBe(200);
  });

  it('returns an array', async () => {
    const res = await request(app).get('/users');
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('has at least one user', async () => {
    const res = await request(app).get('/users');
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('each user has id, name, role, email', async () => {
    const res = await request(app).get('/users');
    res.body.forEach(u => {
      expect(u).toHaveProperty('id');
      expect(u).toHaveProperty('name');
      expect(u).toHaveProperty('role');
      expect(u).toHaveProperty('email');
    });
  });
});

// ── GET /users/:id ───────────────────────────────────────────────
describe('GET /users/:id', () => {
  it('returns user 1', async () => {
    const res = await request(app).get('/users/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body.name).toBe('Alice');
  });

  it('returns 404 for non-existent user', async () => {
    const res = await request(app).get('/users/9999');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

// ── POST /users ──────────────────────────────────────────────────
describe('POST /users', () => {
  it('creates a user and returns 201', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'Test User', email: 'test@example.com' });
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Test User');
    expect(res.body.role).toBe('user');
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/users')
      .send({ email: 'noname@example.com' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'No Email' });
    expect(res.statusCode).toBe(400);
  });
});

// ── Unknown routes ───────────────────────────────────────────────
describe('Unknown routes', () => {
  it('returns 404 for GET /nonexistent', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.statusCode).toBe(404);
  });
});