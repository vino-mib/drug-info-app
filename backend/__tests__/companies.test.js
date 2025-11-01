const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Drug = require('../models/Drug');

describe('Companies API Endpoints', () => {
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
    
    // Insert test data with different companies
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
        genericName: 'Avobenzone',
        brandName: 'CC Cream',
        company: 'Jafra cosmetics International',
        launchDate: new Date('2011-02-02T08:57:26Z')
      },
      {
        code: '52125-617',
        genericName: 'Valacyclovir',
        brandName: 'Valacyclovir',
        company: 'REMEDYREPACK INC.',
        launchDate: new Date('2024-04-07T01:22:52Z')
      },
      {
        code: '65044-6516',
        genericName: 'Fire Ant Mix',
        brandName: 'Fire Ant Mix',
        company: 'Merck Sharp & Dohme Corp.', // Duplicate company
        launchDate: new Date('2004-04-10T05:10:51Z')
      },
      {
        code: '67777-240',
        genericName: 'bacitracin zinc',
        brandName: 'bacitracin zinc',
        company: 'AAA Pharmaceutical Corp.', // For alphabetical sorting test
        launchDate: new Date('2012-09-02T12:06:54Z')
      }
    ];

    await Drug.insertMany(testDrugs);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/companies', () => {
    it('should return all unique company names', async () => {
      const response = await request(app)
        .get('/api/companies')
        .expect(200);

      expect(response.body.companies).toHaveLength(4); // 4 unique companies
      expect(response.body.companies).toContain('Merck Sharp & Dohme Corp.');
      expect(response.body.companies).toContain('Jafra cosmetics International');
      expect(response.body.companies).toContain('REMEDYREPACK INC.');
      expect(response.body.companies).toContain('AAA Pharmaceutical Corp.');
    });

    it('should return companies sorted alphabetically', async () => {
      const response = await request(app)
        .get('/api/companies')
        .expect(200);

      const companies = response.body.companies;
      expect(companies[0]).toBe('AAA Pharmaceutical Corp.');
      expect(companies[1]).toBe('Jafra cosmetics International');
      expect(companies[2]).toBe('Merck Sharp & Dohme Corp.');
      expect(companies[3]).toBe('REMEDYREPACK INC.');
    });

    it('should not include duplicate companies', async () => {
      const response = await request(app)
        .get('/api/companies')
        .expect(200);

      const companies = response.body.companies;
      const merckCount = companies.filter(company => 
        company === 'Merck Sharp & Dohme Corp.'
      ).length;
      
      expect(merckCount).toBe(1); // Should appear only once despite having 2 drugs
    });

    it('should return empty array when no drugs exist', async () => {
      await Drug.deleteMany({});

      const response = await request(app)
        .get('/api/companies')
        .expect(200);

      expect(response.body.companies).toHaveLength(0);
    });

    it('should handle database errors gracefully', async () => {
      // Close the database connection to simulate an error
      await mongoose.connection.close();

      const response = await request(app)
        .get('/api/companies')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch companies');

      // Reconnect for other tests
      const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/druginfo_test';
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    });
  });

  describe('GET /api/companies/stats', () => {
    it('should return company statistics with drug counts', async () => {
      const response = await request(app)
        .get('/api/companies/stats')
        .expect(200);

      expect(response.body.companyStats).toHaveLength(4);
      
      // Find Merck stats (should have 2 drugs)
      const merckStats = response.body.companyStats.find(
        stat => stat._id === 'Merck Sharp & Dohme Corp.'
      );
      expect(merckStats.drugCount).toBe(2);
      expect(merckStats.latestLaunch).toBeDefined();
      expect(merckStats.earliestLaunch).toBeDefined();
    });

    it('should sort companies by drug count descending', async () => {
      const response = await request(app)
        .get('/api/companies/stats')
        .expect(200);

      const stats = response.body.companyStats;
      expect(stats[0]._id).toBe('Merck Sharp & Dohme Corp.'); // 2 drugs
      expect(stats[0].drugCount).toBe(2);
      
      // All others should have 1 drug each
      expect(stats[1].drugCount).toBe(1);
      expect(stats[2].drugCount).toBe(1);
      expect(stats[3].drugCount).toBe(1);
    });

    it('should include launch date statistics', async () => {
      const response = await request(app)
        .get('/api/companies/stats')
        .expect(200);

      const merckStats = response.body.companyStats.find(
        stat => stat._id === 'Merck Sharp & Dohme Corp.'
      );

      expect(merckStats.latestLaunch).toBeDefined();
      expect(merckStats.earliestLaunch).toBeDefined();
      
      // Latest should be 2004-04-10, earliest should be 2004-02-14
      const latest = new Date(merckStats.latestLaunch);
      const earliest = new Date(merckStats.earliestLaunch);
      
      expect(latest.getTime()).toBeGreaterThanOrEqual(earliest.getTime());
    });

    it('should return empty array when no drugs exist', async () => {
      await Drug.deleteMany({});

      const response = await request(app)
        .get('/api/companies/stats')
        .expect(200);

      expect(response.body.companyStats).toHaveLength(0);
    });

    it('should handle single drug companies correctly', async () => {
      const response = await request(app)
        .get('/api/companies/stats')
        .expect(200);

      const singleDrugCompanies = response.body.companyStats.filter(
        stat => stat.drugCount === 1
      );

      expect(singleDrugCompanies).toHaveLength(3);
      
      // For single drug companies, latest and earliest launch should be the same
      singleDrugCompanies.forEach(stat => {
        expect(stat.latestLaunch).toBe(stat.earliestLaunch);
      });
    });
  });
});