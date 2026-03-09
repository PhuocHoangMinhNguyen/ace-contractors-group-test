const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Line = require('./line');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Line.deleteMany({});
});

describe('Line model', () => {
  it('saves a valid line', async () => {
    const line = new Line({ item: 'Labour', rate: 100, quantity: 2, amount: 200 });
    const saved = await line.save();
    expect(saved._id).toBeDefined();
    expect(saved.item).toBe('Labour');
    expect(saved.rate).toBe(100);
    expect(saved.quantity).toBe(2);
    expect(saved.amount).toBe(200);
  });

  it('rejects when item is missing', async () => {
    const line = new Line({ rate: 100, quantity: 2, amount: 200 });
    await expect(line.save()).rejects.toThrow();
  });

  it('rejects when rate is missing', async () => {
    const line = new Line({ item: 'Labour', quantity: 2, amount: 200 });
    await expect(line.save()).rejects.toThrow();
  });

  it('rejects when quantity is missing', async () => {
    const line = new Line({ item: 'Labour', rate: 100, amount: 200 });
    await expect(line.save()).rejects.toThrow();
  });

  it('rejects when amount is missing', async () => {
    const line = new Line({ item: 'Labour', rate: 100, quantity: 2 });
    await expect(line.save()).rejects.toThrow();
  });

  it('stores numeric fields as numbers', async () => {
    const line = new Line({ item: 'Labour', rate: 50.5, quantity: 3, amount: 151.5 });
    const saved = await line.save();
    expect(typeof saved.rate).toBe('number');
    expect(typeof saved.quantity).toBe('number');
    expect(typeof saved.amount).toBe('number');
  });

  it('allows decimal values for rate and amount', async () => {
    const line = new Line({ item: 'Labour', rate: 12.75, quantity: 8, amount: 102 });
    const saved = await line.save();
    expect(saved.rate).toBe(12.75);
  });
});
