const express = require('express');
const request = require('supertest');
const companiesRouter = require('../routes/companies');

// Mock the Drug model
jest.mock('../models/Drug');
const Drug = require('../models/Drug');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/companies', companiesRouter);

describe('Companies Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/companies', () => {
    it('should return all unique companies sorted alphabetically', async () => {
      const mockCompanies = ['Pfizer', 'Abbott', 'Zydus', 'Cipla'];
      Drug.distinct.mockResolvedValue(mockCompanies);

      const response = await request(app)
        .get('/api/companies')
        .expect(200);

      expect(Drug.distinct).toHaveBeenCalledWith('company');
      expect(response.body).toHaveProperty('companies');
      expect(response.body.companies).toEqual(['Abbott', 'Cipla', 'Pfizer', 'Zydus']);
      expect(response.body.companies).toHaveLength(4);
    });

    it('should handle case-insensitive sorting', async () => {
      const mockCompanies = ['zydus', 'Abbott', 'PFIZER', 'cipla'];
      Drug.distinct.mockResolvedValue(mockCompanies);

      const response = await request(app)
        .get('/api/companies')
        .expect(200);

      expect(response.body.companies).toEqual(['Abbott', 'cipla', 'PFIZER', 'zydus']);
    });

    it('should return empty array when no companies exist', async () => {
      Drug.distinct.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/companies')
        .expect(200);

      expect(response.body.companies).toEqual([]);
    });

    it('should handle companies with special characters', async () => {
      const mockCompanies = ['Johnson & Johnson', 'Abbott-Labs', 'Merck & Co.'];
      Drug.distinct.mockResolvedValue(mockCompanies);

      const response = await request(app)
        .get('/api/companies')
        .expect(200);

      expect(response.body.companies).toEqual(['Abbott-Labs', 'Johnson & Johnson', 'Merck & Co.']);
    });

    it('should handle database errors', async () => {
      Drug.distinct.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/companies')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch companies' });
    });

    it('should handle duplicate company names', async () => {
      // MongoDB's distinct() already removes duplicates, so we test with unique values
      const mockCompanies = ['Pfizer', 'Abbott'];
      Drug.distinct.mockResolvedValue(mockCompanies);

      const response = await request(app)
        .get('/api/companies')
        .expect(200);

      // distinct() should already handle duplicates, but test the sorting
      expect(response.body.companies).toEqual(['Abbott', 'Pfizer']);
    });
  });

  describe('GET /api/companies/stats', () => {
    it('should return company statistics sorted by drug count', async () => {
      const mockStats = [
        {
          _id: 'Pfizer',
          drugCount: 15,
          latestLaunch: new Date('2023-03-15'),
          earliestLaunch: new Date('2020-01-15')
        },
        {
          _id: 'Abbott',
          drugCount: 12,
          latestLaunch: new Date('2023-02-10'),
          earliestLaunch: new Date('2019-05-20')
        },
        {
          _id: 'Cipla',
          drugCount: 8,
          latestLaunch: new Date('2023-01-05'),
          earliestLaunch: new Date('2021-03-10')
        }
      ];

      Drug.aggregate.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/companies/stats')
        .expect(200);

      expect(Drug.aggregate).toHaveBeenCalledWith([
        {
          $group: {
            _id: '$company',
            drugCount: { $sum: 1 },
            latestLaunch: { $max: '$launchDate' },
            earliestLaunch: { $min: '$launchDate' }
          }
        },
        {
          $sort: { drugCount: -1 }
        }
      ]);

      expect(response.body).toHaveProperty('companyStats');
      expect(response.body.companyStats).toHaveLength(3);
      expect(response.body.companyStats[0]._id).toBe('Pfizer');
      expect(response.body.companyStats[0].drugCount).toBe(15);
      expect(response.body.companyStats[1].drugCount).toBe(12);
      expect(response.body.companyStats[2].drugCount).toBe(8);
    });

    it('should return empty array when no drugs exist', async () => {
      Drug.aggregate.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/companies/stats')
        .expect(200);

      expect(response.body.companyStats).toEqual([]);
    });

    it('should handle single company with multiple drugs', async () => {
      const mockStats = [
        {
          _id: 'SingleCompany',
          drugCount: 25,
          latestLaunch: new Date('2023-12-01'),
          earliestLaunch: new Date('2020-01-01')
        }
      ];

      Drug.aggregate.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/companies/stats')
        .expect(200);

      expect(response.body.companyStats).toHaveLength(1);
      expect(response.body.companyStats[0].drugCount).toBe(25);
    });

    it('should handle companies with single drug each', async () => {
      const mockStats = [
        {
          _id: 'Company A',
          drugCount: 1,
          latestLaunch: new Date('2023-01-01'),
          earliestLaunch: new Date('2023-01-01')
        },
        {
          _id: 'Company B',
          drugCount: 1,
          latestLaunch: new Date('2023-02-01'),
          earliestLaunch: new Date('2023-02-01')
        }
      ];

      Drug.aggregate.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/companies/stats')
        .expect(200);

      expect(response.body.companyStats).toHaveLength(2);
      expect(response.body.companyStats[0].latestLaunch).toEqual(response.body.companyStats[0].earliestLaunch);
    });

    it('should validate aggregation pipeline structure', async () => {
      Drug.aggregate.mockResolvedValue([]);

      await request(app)
        .get('/api/companies/stats')
        .expect(200);

      const aggregationCall = Drug.aggregate.mock.calls[0][0];
      
      // Verify $group stage
      expect(aggregationCall[0]).toHaveProperty('$group');
      expect(aggregationCall[0].$group).toHaveProperty('_id', '$company');
      expect(aggregationCall[0].$group).toHaveProperty('drugCount', { $sum: 1 });
      expect(aggregationCall[0].$group).toHaveProperty('latestLaunch', { $max: '$launchDate' });
      expect(aggregationCall[0].$group).toHaveProperty('earliestLaunch', { $min: '$launchDate' });

      // Verify $sort stage
      expect(aggregationCall[1]).toHaveProperty('$sort');
      expect(aggregationCall[1].$sort).toEqual({ drugCount: -1 });
    });

    it('should handle database errors in aggregation', async () => {
      Drug.aggregate.mockRejectedValue(new Error('Aggregation failed'));

      const response = await request(app)
        .get('/api/companies/stats')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch company statistics' });
    });

    it('should handle null or undefined launch dates', async () => {
      const mockStats = [
        {
          _id: 'TestCompany',
          drugCount: 2,
          latestLaunch: null,
          earliestLaunch: null
        }
      ];

      Drug.aggregate.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/companies/stats')
        .expect(200);

      expect(response.body.companyStats[0].latestLaunch).toBeNull();
      expect(response.body.companyStats[0].earliestLaunch).toBeNull();
    });

    it('should maintain descending order by drug count', async () => {
      const mockStats = [
        { _id: 'Company A', drugCount: 50 },
        { _id: 'Company B', drugCount: 30 },
        { _id: 'Company C', drugCount: 20 },
        { _id: 'Company D', drugCount: 10 }
      ];

      Drug.aggregate.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/companies/stats')
        .expect(200);

      const drugCounts = response.body.companyStats.map(stat => stat.drugCount);
      expect(drugCounts).toEqual([50, 30, 20, 10]);
    });
  });
});