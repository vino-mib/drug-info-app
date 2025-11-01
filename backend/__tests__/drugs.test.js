const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Drug = require('../models/Drug');

describe('Drug API Endpoints', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/druginfo_test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  beforeEach(async () => {
    // Clear the database before each test
    await Drug.deleteMany({});
    
    // Insert test data
    const testDrugs = [
      {
        code: '0006-0568',
        genericName: 'vorinostat',
        brandName: 'ZOLINZA',
        company: 'Merck Sharp & Dohme Corp.',
        launchDate: new Date('2004-02-14T23:01:10Z')
      },
      {
        code: '68828-192',
        genericName: 'Avobenzone, Octinoxate, Octisalate, Octocrylene',
        brandName: 'CC Cream Complexion Corrector Medium Dark',
        company: 'Jafra cosmetics International',
        launchDate: new Date('2011-02-02T08:57:26Z')
      },
      {
        code: '52125-617',
        genericName: 'Valacyclovir hydrochloride',
        brandName: 'Valacyclovir hydrochloride',
        company: 'REMEDYREPACK INC.',
        launchDate: new Date('2024-04-07T01:22:52Z')
      },
      {
        code: '65044-6516',
        genericName: 'Insects (whole body), Fire Ant Mix',
        brandName: 'Insects (whole body), Fire Ant Mix',
        company: 'Jubilant HollisterStier LLC',
        launchDate: new Date('2004-04-10T05:10:51Z')
      }
    ];

    await Drug.insertMany(testDrugs);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/drugs', () => {
    it('should return all drugs sorted by launch date descending', async () => {
      const response = await request(app)
        .get('/api/drugs')
        .expect(200);

      expect(response.body.drugs).toHaveLength(4);
      expect(response.body.drugs[0].code).toBe('52125-617'); // Most recent (2024)
      expect(response.body.drugs[3].code).toBe('0006-0568'); // Oldest (2004-02)
      
      // Check if pagination info is included
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.totalCount).toBe(4);
    });

    it('should filter drugs by company', async () => {
      const response = await request(app)
        .get('/api/drugs?company=Merck Sharp & Dohme Corp.')
        .expect(200);

      expect(response.body.drugs).toHaveLength(1);
      expect(response.body.drugs[0].company).toBe('Merck Sharp & Dohme Corp.');
      expect(response.body.drugs[0].code).toBe('0006-0568');
    });

    it('should handle pagination correctly', async () => {
      const response = await request(app)
        .get('/api/drugs?page=1&limit=2')
        .expect(200);

      expect(response.body.drugs).toHaveLength(2);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    it('should return sequential IDs starting from correct position', async () => {
      const response = await request(app)
        .get('/api/drugs?page=2&limit=2')
        .expect(200);

      expect(response.body.drugs[0].sequentialId).toBe(3);
      expect(response.body.drugs[1].sequentialId).toBe(4);
    });

    it('should include display name in response', async () => {
      const response = await request(app)
        .get('/api/drugs')
        .expect(200);

      expect(response.body.drugs[0].displayName).toBeDefined();
      expect(response.body.drugs[0].displayName).toContain('(');
      expect(response.body.drugs[0].displayName).toContain(')');
    });

    it('should sort by different fields when specified', async () => {
      const response = await request(app)
        .get('/api/drugs?sortBy=code&sortOrder=asc')
        .expect(200);

      expect(response.body.drugs[0].code).toBe('0006-0568');
      expect(response.body.drugs[3].code).toBe('68828-192');
    });

    it('should return empty result for non-existent company', async () => {
      const response = await request(app)
        .get('/api/drugs?company=NonExistentCompany')
        .expect(200);

      expect(response.body.drugs).toHaveLength(0);
      expect(response.body.pagination.totalCount).toBe(0);
    });
  });

  describe('GET /api/drugs/:id', () => {
    it('should return a single drug by ID', async () => {
      const drugs = await Drug.find().limit(1);
      const drugId = drugs[0]._id.toString();

      const response = await request(app)
        .get(`/api/drugs/${drugId}`)
        .expect(200);

      expect(response.body.id).toBe(drugId);
      expect(response.body.code).toBe(drugs[0].code);
      expect(response.body.displayName).toBeDefined();
    });

    it('should return 404 for non-existent drug ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/drugs/${nonExistentId}`)
        .expect(404);

      expect(response.body.error).toBe('Drug not found');
    });

    it('should return 500 for invalid drug ID format', async () => {
      const response = await request(app)
        .get('/api/drugs/invalid-id')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch drug');
    });
  });

  describe('POST /api/drugs', () => {
    it('should create a new drug', async () => {
      const newDrug = {
        code: 'TEST-123',
        genericName: 'Test Generic',
        brandName: 'Test Brand',
        company: 'Test Company',
        launchDate: '2023-01-01T00:00:00Z'
      };

      const response = await request(app)
        .post('/api/drugs')
        .send(newDrug)
        .expect(201);

      expect(response.body.code).toBe(newDrug.code);
      expect(response.body.genericName).toBe(newDrug.genericName);
      expect(response.body.id).toBeDefined();
    });

    it('should return 400 for duplicate drug code', async () => {
      const duplicateDrug = {
        code: '0006-0568', // This already exists
        genericName: 'Test Generic',
        brandName: 'Test Brand',
        company: 'Test Company',
        launchDate: '2023-01-01T00:00:00Z'
      };

      const response = await request(app)
        .post('/api/drugs')
        .send(duplicateDrug)
        .expect(400);

      expect(response.body.error).toBe('Drug code already exists');
    });

    it('should return 500 for missing required fields', async () => {
      const incompleteDrug = {
        code: 'TEST-456',
        genericName: 'Test Generic'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/drugs')
        .send(incompleteDrug)
        .expect(500);

      expect(response.body.error).toBe('Failed to create drug');
    });
  });
});