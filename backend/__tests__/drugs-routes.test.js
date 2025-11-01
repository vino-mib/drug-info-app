const express = require('express');
const request = require('supertest');
const drugsRouter = require('../routes/drugs');

// Mock the Drug model
jest.mock('../models/Drug');
const Drug = require('../models/Drug');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/drugs', drugsRouter);

describe('Drugs Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/drugs', () => {
    const mockDrugs = [
      {
        _id: '64f1234567890abcdef12345',
        code: 'DRUG-001',
        genericName: 'Generic Name 1',
        brandName: 'Brand Name 1',
        company: 'Company A',
        launchDate: new Date('2023-01-15'),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      },
      {
        _id: '64f1234567890abcdef12346',
        code: 'DRUG-002',
        genericName: 'Generic Name 2',
        brandName: 'Brand Name 2',
        company: 'Company B',
        launchDate: new Date('2023-02-15'),
        createdAt: new Date('2023-01-02'),
        updatedAt: new Date('2023-01-02')
      }
    ];

    it('should return all drugs with default pagination', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockDrugs)
      };
      Drug.find.mockReturnValue(mockQuery);
      Drug.countDocuments.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/drugs')
        .expect(200);

      expect(response.body).toHaveProperty('drugs');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.drugs).toHaveLength(2);
      expect(response.body.drugs[0]).toHaveProperty('id');
      expect(response.body.drugs[0]).toHaveProperty('displayName');
      expect(response.body.drugs[0]).toHaveProperty('sequentialId');
      expect(response.body.drugs[0].displayName).toBe('Generic Name 1 (Brand Name 1)');
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalCount).toBe(2);
    });

    it('should filter drugs by company', async () => {
      const filteredMockDrugs = [mockDrugs[0]];
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(filteredMockDrugs)
      };
      Drug.find.mockReturnValue(mockQuery);
      Drug.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/drugs?company=Company A')
        .expect(200);

      expect(Drug.find).toHaveBeenCalledWith({ company: 'Company A' });
      expect(response.body.drugs).toHaveLength(1);
      expect(response.body.drugs[0].company).toBe('Company A');
    });

    it('should handle pagination correctly', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockDrugs[1]])
      };
      Drug.find.mockReturnValue(mockQuery);
      Drug.countDocuments.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/drugs?page=2&limit=1')
        .expect(200);

      expect(mockQuery.skip).toHaveBeenCalledWith(1);
      expect(mockQuery.limit).toHaveBeenCalledWith(1);
      expect(response.body.pagination.currentPage).toBe(2);
      expect(response.body.pagination.hasNextPage).toBe(false);
      expect(response.body.pagination.hasPrevPage).toBe(true);
    });

    it('should handle custom sorting', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockDrugs)
      };
      Drug.find.mockReturnValue(mockQuery);
      Drug.countDocuments.mockResolvedValue(2);

      await request(app)
        .get('/api/drugs?sortBy=company&sortOrder=asc')
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith({ company: 1 });
    });

    it('should handle sequential ID calculation correctly', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockDrugs)
      };
      Drug.find.mockReturnValue(mockQuery);
      Drug.countDocuments.mockResolvedValue(10);

      const response = await request(app)
        .get('/api/drugs?page=3&limit=2')
        .expect(200);

      expect(response.body.drugs[0].sequentialId).toBe(5); // (3-1)*2 + 1 = 5
      expect(response.body.drugs[1].sequentialId).toBe(6); // (3-1)*2 + 2 = 6
    });

    it('should ignore empty company filter', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockDrugs)
      };
      Drug.find.mockReturnValue(mockQuery);
      Drug.countDocuments.mockResolvedValue(2);

      await request(app)
        .get('/api/drugs?company=   ')
        .expect(200);

      expect(Drug.find).toHaveBeenCalledWith({});
    });

    it('should handle database errors', async () => {
      Drug.find.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/api/drugs')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch drugs' });
    });
  });

  describe('GET /api/drugs/:id', () => {
    const mockDrug = {
      _id: '64f1234567890abcdef12345',
      code: 'DRUG-001',
      genericName: 'Generic Name 1',
      brandName: 'Brand Name 1',
      company: 'Company A',
      launchDate: new Date('2023-01-15')
    };

    it('should return a single drug by ID', async () => {
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(mockDrug)
      };
      Drug.findById.mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/drugs/64f1234567890abcdef12345')
        .expect(200);

      expect(Drug.findById).toHaveBeenCalledWith('64f1234567890abcdef12345');
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('displayName');
      expect(response.body.displayName).toBe('Generic Name 1 (Brand Name 1)');
      expect(response.body.code).toBe('DRUG-001');
    });

    it('should return 404 for non-existent drug', async () => {
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(null)
      };
      Drug.findById.mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/drugs/64f1234567890abcdef99999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Drug not found' });
    });

    it('should handle database errors', async () => {
      Drug.findById.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app)
        .get('/api/drugs/64f1234567890abcdef12345')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch drug' });
    });
  });

  describe('POST /api/drugs', () => {
    const mockDrugData = {
      code: 'DRUG-003',
      genericName: 'New Generic Name',
      brandName: 'New Brand Name',
      company: 'New Company',
      launchDate: '2023-03-15'
    };

    it('should create a new drug', async () => {
      const mockSavedDrug = {
        _id: '64f1234567890abcdef12347',
        ...mockDrugData,
        launchDate: new Date(mockDrugData.launchDate)
      };

      const mockDrug = {
        save: jest.fn().mockResolvedValue(mockSavedDrug),
        toJSON: jest.fn().mockReturnValue({
          _id: '64f1234567890abcdef12347',
          ...mockDrugData,
          launchDate: new Date(mockDrugData.launchDate)
        }),
        _id: '64f1234567890abcdef12347'
      };

      // Mock the Drug constructor
      Drug.mockImplementation(() => mockDrug);

      const response = await request(app)
        .post('/api/drugs')
        .send(mockDrugData)
        .expect(201);

      expect(Drug).toHaveBeenCalledWith({
        code: 'DRUG-003',
        genericName: 'New Generic Name',
        brandName: 'New Brand Name',
        company: 'New Company',
        launchDate: new Date('2023-03-15')
      });
      expect(mockDrug.save).toHaveBeenCalled();
      expect(response.body).toHaveProperty('id');
      expect(response.body.code).toBe('DRUG-003');
    });

    it('should return 400 for duplicate drug code', async () => {
      const mockDrug = {
        save: jest.fn().mockRejectedValue({ code: 11000 }),
        toJSON: jest.fn(),
        _id: '64f1234567890abcdef12347'
      };
      Drug.mockImplementation(() => mockDrug);

      const response = await request(app)
        .post('/api/drugs')
        .send(mockDrugData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Drug code already exists' });
    });

    it('should handle other database errors', async () => {
      const mockDrug = {
        save: jest.fn().mockRejectedValue(new Error('Validation failed')),
        toJSON: jest.fn(),
        _id: '64f1234567890abcdef12347'
      };
      Drug.mockImplementation(() => mockDrug);

      const response = await request(app)
        .post('/api/drugs')
        .send(mockDrugData)
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to create drug' });
    });

    it('should handle missing required fields', async () => {
      const mockDrug = {
        save: jest.fn().mockRejectedValue(new Error('Missing required field')),
        toJSON: jest.fn(),
        _id: '64f1234567890abcdef12347'
      };
      Drug.mockImplementation(() => mockDrug);

      const response = await request(app)
        .post('/api/drugs')
        .send({ code: 'INCOMPLETE' })
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to create drug' });
    });
  });
});