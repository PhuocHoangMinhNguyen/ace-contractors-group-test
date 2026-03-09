const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const request = require('supertest');

const linesRouter = require('./lines');
const Line = require('../models/line');

let mongoServer;
let app;
let mockIo;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());
  mockIo = { emit: jest.fn() };
  app.set('io', mockIo);
  app.use('/api/lines', linesRouter);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Line.deleteMany({});
  mockIo.emit.mockClear();
});

// ── POST /api/lines ──────────────────────────────────────────────────────────

describe('POST /api/lines', () => {
  it('returns 201 with lineId on success', async () => {
    const res = await request(app)
      .post('/api/lines')
      .send({ item: 'Labour', rate: 100, quantity: 2, amount: 200 });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Line added successfully');
    expect(res.body.lineId).toBeDefined();
  });

  it('persists the line to the database', async () => {
    await request(app)
      .post('/api/lines')
      .send({ item: 'Materials', rate: 50, quantity: 4, amount: 200 });

    const lines = await Line.find();
    expect(lines).toHaveLength(1);
    expect(lines[0].item).toBe('Materials');
    expect(lines[0].rate).toBe(50);
    expect(lines[0].quantity).toBe(4);
    expect(lines[0].amount).toBe(200);
  });

  it('emits "added" socket event with the created line', async () => {
    await request(app)
      .post('/api/lines')
      .send({ item: 'Equipment', rate: 200, quantity: 1, amount: 200 });

    expect(mockIo.emit).toHaveBeenCalledWith(
      'added',
      expect.objectContaining({ item: 'Equipment' })
    );
  });

  it('stores the lineId returned in the DB', async () => {
    const res = await request(app)
      .post('/api/lines')
      .send({ item: 'Labour', rate: 100, quantity: 2, amount: 200 });

    const found = await Line.findById(res.body.lineId);
    expect(found).not.toBeNull();
    expect(found.item).toBe('Labour');
  });
});

// ── GET /api/lines ───────────────────────────────────────────────────────────

describe('GET /api/lines', () => {
  it('returns 200 with an empty array when no lines exist', async () => {
    const res = await request(app).get('/api/lines');
    expect(res.status).toBe(200);
    expect(res.body.lines).toEqual([]);
  });

  it('returns all lines with a success message', async () => {
    await Line.create({ item: 'Labour', rate: 100, quantity: 2, amount: 200 });
    await Line.create({ item: 'Materials', rate: 50, quantity: 4, amount: 200 });

    const res = await request(app).get('/api/lines');
    expect(res.status).toBe(200);
    expect(res.body.lines).toHaveLength(2);
    expect(res.body.message).toBe('Lines fetched successfully!');
  });

  it('returns correct field values for each line', async () => {
    await Line.create({ item: 'Labour', rate: 100, quantity: 2, amount: 200 });

    const res = await request(app).get('/api/lines');
    const line = res.body.lines[0];
    expect(line.item).toBe('Labour');
    expect(line.rate).toBe(100);
    expect(line.quantity).toBe(2);
    expect(line.amount).toBe(200);
  });
});

// ── PUT /api/lines/:id ───────────────────────────────────────────────────────

describe('PUT /api/lines/:id', () => {
  it('returns 200 with a success message', async () => {
    const created = await Line.create({ item: 'Labour', rate: 100, quantity: 2, amount: 200 });

    const res = await request(app)
      .put(`/api/lines/${created._id}`)
      .send({ id: created._id.toString(), item: 'Labour', rate: 150, quantity: 3, amount: 450 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Update successful!');
  });

  it('updates the line in the database', async () => {
    const created = await Line.create({ item: 'Labour', rate: 100, quantity: 2, amount: 200 });

    await request(app)
      .put(`/api/lines/${created._id}`)
      .send({ id: created._id.toString(), item: 'Labour', rate: 150, quantity: 3, amount: 450 });

    const updated = await Line.findById(created._id);
    expect(updated.rate).toBe(150);
    expect(updated.quantity).toBe(3);
    expect(updated.amount).toBe(450);
  });

  it('emits "updated" socket event with the updated line', async () => {
    const created = await Line.create({ item: 'Labour', rate: 100, quantity: 2, amount: 200 });

    await request(app)
      .put(`/api/lines/${created._id}`)
      .send({ id: created._id.toString(), item: 'Labour', rate: 150, quantity: 3, amount: 450 });

    expect(mockIo.emit).toHaveBeenCalledWith(
      'updated',
      expect.objectContaining({ item: 'Labour' })
    );
  });

  it('does not modify other lines', async () => {
    const target = await Line.create({ item: 'Labour', rate: 100, quantity: 2, amount: 200 });
    await Line.create({ item: 'Materials', rate: 50, quantity: 4, amount: 200 });

    await request(app)
      .put(`/api/lines/${target._id}`)
      .send({ id: target._id.toString(), item: 'Labour', rate: 150, quantity: 3, amount: 450 });

    const other = await Line.findOne({ item: 'Materials' });
    expect(other.rate).toBe(50);
  });
});

// ── DELETE /api/lines/:item ──────────────────────────────────────────────────

describe('DELETE /api/lines/:item', () => {
  it('returns 200 with a success message', async () => {
    await Line.create({ item: 'Labour', rate: 100, quantity: 2, amount: 200 });

    const res = await request(app).delete('/api/lines/Labour');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Line deleted!');
  });

  it('removes the line from the database', async () => {
    await Line.create({ item: 'Labour', rate: 100, quantity: 2, amount: 200 });

    await request(app).delete('/api/lines/Labour');

    const remaining = await Line.find();
    expect(remaining).toHaveLength(0);
  });

  it('emits "deleted" socket event with the item name', async () => {
    await Line.create({ item: 'Labour', rate: 100, quantity: 2, amount: 200 });

    await request(app).delete('/api/lines/Labour');

    expect(mockIo.emit).toHaveBeenCalledWith('deleted', 'Labour');
  });

  it('deletes by item name and leaves other lines intact', async () => {
    await Line.create({ item: 'Labour', rate: 100, quantity: 2, amount: 200 });
    await Line.create({ item: 'Materials', rate: 50, quantity: 4, amount: 200 });

    await request(app).delete('/api/lines/Labour');

    const remaining = await Line.find();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].item).toBe('Materials');
  });

  it('returns 200 even when no matching line exists', async () => {
    const res = await request(app).delete('/api/lines/NonExistent');
    expect(res.status).toBe(200);
  });
});
