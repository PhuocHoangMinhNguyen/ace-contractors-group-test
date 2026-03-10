const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

let mongod;
let app;
const mockIo = { emit: jest.fn() };

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    // Require app after env is set so mongoose.connect gets the in-memory URI
    app = require('../app');
    app.set('io', mockIo);
    await mongoose.connection.asPromise();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

afterEach(async () => {
    // Clear all collections between tests
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
    mockIo.emit.mockClear();
});

// ── GET /api/lines ─────────────────────────────────────────────────────────

describe('GET /api/lines', () => {
    it('returns 200 with an empty lines array when no lines exist', async () => {
        const res = await request(app).get('/api/lines');
        expect(res.status).toBe(200);
        expect(res.body.lines).toEqual([]);
    });

    it('returns saved lines', async () => {
        await request(app).post('/api/lines')
            .send({ item: 'Labour', rate: 100, quantity: 2 });

        const res = await request(app).get('/api/lines');
        expect(res.status).toBe(200);
        expect(res.body.lines).toHaveLength(1);
        expect(res.body.lines[0].item).toBe('Labour');
    });
});

// ── POST /api/lines ────────────────────────────────────────────────────────

describe('POST /api/lines', () => {
    it('creates a line and returns 201 with lineId', async () => {
        const res = await request(app).post('/api/lines')
            .send({ item: 'Labour', rate: 100, quantity: 2 });

        expect(res.status).toBe(201);
        expect(res.body.lineId).toBeDefined();
    });

    it('calculates amount server-side and ignores client-supplied amount', async () => {
        await request(app).post('/api/lines')
            .send({ item: 'Labour', rate: 100, quantity: 2, amount: 999999 });

        const lines = await request(app).get('/api/lines');
        expect(lines.body.lines[0].amount).toBe(200);
    });

    it('emits "added" socket event after creation', async () => {
        await request(app).post('/api/lines')
            .send({ item: 'Materials', rate: 50, quantity: 4 });

        expect(mockIo.emit).toHaveBeenCalledWith('added', expect.objectContaining({
            item: 'Materials',
            amount: 200
        }));
    });

    it('returns 400 when item is missing', async () => {
        const res = await request(app).post('/api/lines')
            .send({ rate: 100, quantity: 2 });
        expect(res.status).toBe(400);
    });

    it('returns 400 when item is an empty string', async () => {
        const res = await request(app).post('/api/lines')
            .send({ item: '   ', rate: 100, quantity: 2 });
        expect(res.status).toBe(400);
    });

    it('returns 400 when rate is negative', async () => {
        const res = await request(app).post('/api/lines')
            .send({ item: 'Labour', rate: -10, quantity: 2 });
        expect(res.status).toBe(400);
    });

    it('returns 400 when rate is not a number', async () => {
        const res = await request(app).post('/api/lines')
            .send({ item: 'Labour', rate: 'abc', quantity: 2 });
        expect(res.status).toBe(400);
    });

    it('returns 400 when quantity is negative', async () => {
        const res = await request(app).post('/api/lines')
            .send({ item: 'Labour', rate: 100, quantity: -1 });
        expect(res.status).toBe(400);
    });

    it('returns 400 when quantity is not a number', async () => {
        const res = await request(app).post('/api/lines')
            .send({ item: 'Labour', rate: 100, quantity: 'many' });
        expect(res.status).toBe(400);
    });

    it('saves category field when provided', async () => {
        const res = await request(app).post('/api/lines')
            .send({ item: 'Labour', rate: 100, quantity: 2, category: 'Labour' });

        expect(res.status).toBe(201);
        expect(res.body.lineId).toBeDefined();

        const lines = await request(app).get('/api/lines');
        expect(lines.body.lines[0].category).toBe('Labour');
    });

    it('returns 400 when category is invalid', async () => {
        const res = await request(app).post('/api/lines')
            .send({ item: 'Labour', rate: 100, quantity: 2, category: 'InvalidCategory' });
        expect(res.status).toBe(400);
    });

    it('saves taxable and taxRate fields when provided', async () => {
        const res = await request(app).post('/api/lines')
            .send({ item: 'Labour', rate: 100, quantity: 2, taxable: true, taxRate: 10 });

        expect(res.status).toBe(201);

        const lines = await request(app).get('/api/lines');
        expect(lines.body.lines[0].taxable).toBe(true);
        expect(lines.body.lines[0].taxRate).toBe(10);
    });

    it('returns 400 when taxRate exceeds 100', async () => {
        const res = await request(app).post('/api/lines')
            .send({ item: 'Labour', rate: 100, quantity: 2, taxRate: 150 });
        expect(res.status).toBe(400);
    });
});

// ── PUT /api/lines/:id ─────────────────────────────────────────────────────

describe('PUT /api/lines/:id', () => {
    it('updates an existing line and returns 200', async () => {
        const created = await request(app).post('/api/lines')
            .send({ item: 'Labour', rate: 100, quantity: 2 });
        const id = created.body.lineId;

        const res = await request(app).put(`/api/lines/${id}`)
            .send({ id, item: 'Labour', rate: 150, quantity: 3 });

        expect(res.status).toBe(200);
    });

    it('recalculates amount server-side on update', async () => {
        const created = await request(app).post('/api/lines')
            .send({ item: 'Labour', rate: 100, quantity: 2 });
        const id = created.body.lineId;

        await request(app).put(`/api/lines/${id}`)
            .send({ id, item: 'Labour', rate: 150, quantity: 3, amount: 999 });

        const lines = await request(app).get('/api/lines');
        expect(lines.body.lines[0].amount).toBe(450);
    });

    it('emits "updated" socket event after update', async () => {
        const created = await request(app).post('/api/lines')
            .send({ item: 'Labour', rate: 100, quantity: 2 });
        const id = created.body.lineId;
        mockIo.emit.mockClear();

        await request(app).put(`/api/lines/${id}`)
            .send({ id, item: 'Labour', rate: 200, quantity: 1 });

        expect(mockIo.emit).toHaveBeenCalledWith('updated', expect.objectContaining({ item: 'Labour' }));
    });

    it('returns 404 when ID does not exist', async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        const res = await request(app).put(`/api/lines/${nonExistentId}`)
            .send({ id: nonExistentId, item: 'Labour', rate: 100, quantity: 2 });
        expect(res.status).toBe(404);
    });

    it('returns 500 when ID is malformed', async () => {
        const res = await request(app).put('/api/lines/not-a-valid-id')
            .send({ id: 'not-a-valid-id', item: 'Labour', rate: 100, quantity: 2 });
        expect(res.status).toBe(500);
    });

    it('returns 400 when item is missing on update', async () => {
        const created = await request(app).post('/api/lines')
            .send({ item: 'Labour', rate: 100, quantity: 2 });
        const id = created.body.lineId;

        const res = await request(app).put(`/api/lines/${id}`)
            .send({ id, rate: 150, quantity: 3 });
        expect(res.status).toBe(400);
    });

    it('returns 400 when rate is negative on update', async () => {
        const created = await request(app).post('/api/lines')
            .send({ item: 'Labour', rate: 100, quantity: 2 });
        const id = created.body.lineId;

        const res = await request(app).put(`/api/lines/${id}`)
            .send({ id, item: 'Labour', rate: -5, quantity: 3 });
        expect(res.status).toBe(400);
    });

    it('returns 400 when quantity is negative on update', async () => {
        const created = await request(app).post('/api/lines')
            .send({ item: 'Labour', rate: 100, quantity: 2 });
        const id = created.body.lineId;

        const res = await request(app).put(`/api/lines/${id}`)
            .send({ id, item: 'Labour', rate: 100, quantity: -1 });
        expect(res.status).toBe(400);
    });
});

// ── DELETE /api/lines/:id ──────────────────────────────────────────────────

describe('DELETE /api/lines/:id', () => {
    it('deletes an existing line and returns 200', async () => {
        const created = await request(app).post('/api/lines')
            .send({ item: 'Labour', rate: 100, quantity: 2 });
        const id = created.body.lineId;

        const res = await request(app).delete(`/api/lines/${id}`);
        expect(res.status).toBe(200);
    });

    it('emits "deleted" socket event with id and item after deletion', async () => {
        const created = await request(app).post('/api/lines')
            .send({ item: 'Labour', rate: 100, quantity: 2 });
        const id = created.body.lineId;
        mockIo.emit.mockClear();

        await request(app).delete(`/api/lines/${id}`);

        expect(mockIo.emit).toHaveBeenCalledWith('deleted', { id, item: 'Labour' });
    });

    it('emits "deleted" with the id when document is not found', async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        mockIo.emit.mockClear();

        await request(app).delete(`/api/lines/${nonExistentId}`);

        expect(mockIo.emit).toHaveBeenCalledWith('deleted', { id: nonExistentId, item: null });
    });

    it('returns 500 when ID is malformed', async () => {
        const res = await request(app).delete('/api/lines/not-a-valid-id');
        expect(res.status).toBe(500);
    });
});

// ── GET /api/lines (pagination, filter, sort) ──────────────────────────────

describe('GET /api/lines with query params', () => {
    beforeEach(async () => {
        await request(app).post('/api/lines').send({ item: 'Labour A', rate: 100, quantity: 3 });
        await request(app).post('/api/lines').send({ item: 'Materials B', rate: 50, quantity: 4 });
        await request(app).post('/api/lines').send({ item: 'Labour C', rate: 200, quantity: 1 });
    });

    it('returns paginated results with total, page, pageSize when page and pageSize are provided', async () => {
        const res = await request(app).get('/api/lines?page=1&pageSize=2');

        expect(res.status).toBe(200);
        expect(res.body.lines).toHaveLength(2);
        expect(res.body.total).toBe(3);
        expect(res.body.page).toBe(1);
        expect(res.body.pageSize).toBe(2);
    });

    it('returns second page of results correctly', async () => {
        const res = await request(app).get('/api/lines?page=2&pageSize=2');

        expect(res.status).toBe(200);
        expect(res.body.lines).toHaveLength(1);
        expect(res.body.total).toBe(3);
        expect(res.body.page).toBe(2);
        expect(res.body.pageSize).toBe(2);
    });

    it('filters lines by substring match on item name', async () => {
        const res = await request(app).get('/api/lines?filter=Lab');

        expect(res.status).toBe(200);
        expect(res.body.lines).toHaveLength(2);
        res.body.lines.forEach(line => {
            expect(line.item).toMatch(/Lab/i);
        });
    });

    it('returns lines sorted by amount descending', async () => {
        const res = await request(app).get('/api/lines?sortField=amount&sortDir=desc');

        expect(res.status).toBe(200);
        expect(res.body.lines).toHaveLength(3);
        const amounts = res.body.lines.map(l => l.amount);
        expect(amounts[0]).toBeGreaterThanOrEqual(amounts[1]);
        expect(amounts[1]).toBeGreaterThanOrEqual(amounts[2]);
    });

    it('bare GET /api/lines still returns all lines without pagination metadata', async () => {
        const res = await request(app).get('/api/lines');

        expect(res.status).toBe(200);
        expect(res.body.lines).toHaveLength(3);
        expect(res.body.total).toBeUndefined();
        expect(res.body.page).toBeUndefined();
        expect(res.body.pageSize).toBeUndefined();
    });
});
