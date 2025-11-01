const mongoose = require('mongoose');
const Drug = require('../models/Drug');

describe('Drug Model', () => {
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
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Schema Validation', () => {
    it('should create a drug with all required fields', async () => {
      const drugData = {
        code: 'TEST-001',
        genericName: 'Test Generic Name',
        brandName: 'Test Brand Name',
        company: 'Test Company',
        launchDate: new Date('2023-01-01')
      };

      const drug = new Drug(drugData);
      const savedDrug = await drug.save();

      expect(savedDrug._id).toBeDefined();
      expect(savedDrug.code).toBe(drugData.code);
      expect(savedDrug.genericName).toBe(drugData.genericName);
      expect(savedDrug.brandName).toBe(drugData.brandName);
      expect(savedDrug.company).toBe(drugData.company);
      expect(savedDrug.launchDate).toEqual(drugData.launchDate);
      expect(savedDrug.createdAt).toBeDefined();
      expect(savedDrug.updatedAt).toBeDefined();
    });

    it('should require code field', async () => {
      const drugData = {
        genericName: 'Test Generic Name',
        brandName: 'Test Brand Name',
        company: 'Test Company',
        launchDate: new Date('2023-01-01')
      };

      const drug = new Drug(drugData);
      
      await expect(drug.save()).rejects.toThrow();
    });

    it('should require genericName field', async () => {
      const drugData = {
        code: 'TEST-001',
        brandName: 'Test Brand Name',
        company: 'Test Company',
        launchDate: new Date('2023-01-01')
      };

      const drug = new Drug(drugData);
      
      await expect(drug.save()).rejects.toThrow();
    });

    it('should require brandName field', async () => {
      const drugData = {
        code: 'TEST-001',
        genericName: 'Test Generic Name',
        company: 'Test Company',
        launchDate: new Date('2023-01-01')
      };

      const drug = new Drug(drugData);
      
      await expect(drug.save()).rejects.toThrow();
    });

    it('should require company field', async () => {
      const drugData = {
        code: 'TEST-001',
        genericName: 'Test Generic Name',
        brandName: 'Test Brand Name',
        launchDate: new Date('2023-01-01')
      };

      const drug = new Drug(drugData);
      
      await expect(drug.save()).rejects.toThrow();
    });

    it('should require launchDate field', async () => {
      const drugData = {
        code: 'TEST-001',
        genericName: 'Test Generic Name',
        brandName: 'Test Brand Name',
        company: 'Test Company'
      };

      const drug = new Drug(drugData);
      
      await expect(drug.save()).rejects.toThrow();
    });

    it('should enforce unique code constraint', async () => {
      const drugData1 = {
        code: 'DUPLICATE-001',
        genericName: 'Test Generic Name 1',
        brandName: 'Test Brand Name 1',
        company: 'Test Company 1',
        launchDate: new Date('2023-01-01')
      };

      const drugData2 = {
        code: 'DUPLICATE-001', // Same code
        genericName: 'Test Generic Name 2',
        brandName: 'Test Brand Name 2',
        company: 'Test Company 2',
        launchDate: new Date('2023-01-02')
      };

      const drug1 = new Drug(drugData1);
      await drug1.save();

      const drug2 = new Drug(drugData2);
      await expect(drug2.save()).rejects.toThrow();
    });
  });

  describe('Virtual Fields', () => {
    it('should generate displayName virtual field', async () => {
      const drugData = {
        code: 'TEST-001',
        genericName: 'Acetaminophen',
        brandName: 'Tylenol',
        company: 'Test Company',
        launchDate: new Date('2023-01-01')
      };

      const drug = new Drug(drugData);
      const savedDrug = await drug.save();

      expect(savedDrug.displayName).toBe('Acetaminophen (Tylenol)');
    });

    it('should include virtual fields in JSON serialization', async () => {
      const drugData = {
        code: 'TEST-001',
        genericName: 'Ibuprofen',
        brandName: 'Advil',
        company: 'Test Company',
        launchDate: new Date('2023-01-01')
      };

      const drug = new Drug(drugData);
      const savedDrug = await drug.save();
      const drugJSON = savedDrug.toJSON();

      expect(drugJSON.displayName).toBe('Ibuprofen (Advil)');
      expect(drugJSON.id).toBeDefined(); // Should include the virtual id field
    });
  });

  describe('Data Types and Validation', () => {
    it('should accept valid date strings for launchDate', async () => {
      const drugData = {
        code: 'TEST-001',
        genericName: 'Test Generic',
        brandName: 'Test Brand',
        company: 'Test Company',
        launchDate: '2023-05-15T10:30:00Z'
      };

      const drug = new Drug(drugData);
      const savedDrug = await drug.save();

      expect(savedDrug.launchDate).toBeInstanceOf(Date);
      expect(savedDrug.launchDate.getFullYear()).toBe(2023);
      expect(savedDrug.launchDate.getMonth()).toBe(4); // 0-indexed months
    });

    it('should reject invalid date values for launchDate', async () => {
      const drugData = {
        code: 'TEST-001',
        genericName: 'Test Generic',
        brandName: 'Test Brand',
        company: 'Test Company',
        launchDate: 'invalid-date'
      };

      const drug = new Drug(drugData);
      
      await expect(drug.save()).rejects.toThrow();
    });

    it('should handle string fields correctly', async () => {
      const drugData = {
        code: 'TEST-001',
        genericName: 'Test Generic with Special Characters !@#$%',
        brandName: 'Test Brand with Numbers 123',
        company: 'Test Company & Co.',
        launchDate: new Date('2023-01-01')
      };

      const drug = new Drug(drugData);
      const savedDrug = await drug.save();

      expect(savedDrug.genericName).toBe(drugData.genericName);
      expect(savedDrug.brandName).toBe(drugData.brandName);
      expect(savedDrug.company).toBe(drugData.company);
    });
  });

  describe('Database Operations', () => {
    it('should support finding drugs by code', async () => {
      const drugData = {
        code: 'FIND-001',
        genericName: 'Findable Generic',
        brandName: 'Findable Brand',
        company: 'Findable Company',
        launchDate: new Date('2023-01-01')
      };

      const drug = new Drug(drugData);
      await drug.save();

      const foundDrug = await Drug.findOne({ code: 'FIND-001' });
      expect(foundDrug).toBeTruthy();
      expect(foundDrug.code).toBe('FIND-001');
    });

    it('should support finding drugs by company', async () => {
      const drugs = [
        {
          code: 'COMP-001',
          genericName: 'Generic 1',
          brandName: 'Brand 1',
          company: 'Target Company',
          launchDate: new Date('2023-01-01')
        },
        {
          code: 'COMP-002',
          genericName: 'Generic 2',
          brandName: 'Brand 2',
          company: 'Target Company',
          launchDate: new Date('2023-01-02')
        },
        {
          code: 'COMP-003',
          genericName: 'Generic 3',
          brandName: 'Brand 3',
          company: 'Other Company',
          launchDate: new Date('2023-01-03')
        }
      ];

      await Drug.insertMany(drugs);

      const foundDrugs = await Drug.find({ company: 'Target Company' });
      expect(foundDrugs).toHaveLength(2);
      expect(foundDrugs.every(drug => drug.company === 'Target Company')).toBe(true);
    });

    it('should support sorting by launchDate', async () => {
      const drugs = [
        {
          code: 'SORT-001',
          genericName: 'Generic 1',
          brandName: 'Brand 1',
          company: 'Company 1',
          launchDate: new Date('2023-03-01')
        },
        {
          code: 'SORT-002',
          genericName: 'Generic 2',
          brandName: 'Brand 2',
          company: 'Company 2',
          launchDate: new Date('2023-01-01')
        },
        {
          code: 'SORT-003',
          genericName: 'Generic 3',
          brandName: 'Brand 3',
          company: 'Company 3',
          launchDate: new Date('2023-02-01')
        }
      ];

      await Drug.insertMany(drugs);

      const sortedDrugs = await Drug.find().sort({ launchDate: -1 });
      expect(sortedDrugs[0].code).toBe('SORT-001'); // Most recent
      expect(sortedDrugs[1].code).toBe('SORT-003'); // Middle
      expect(sortedDrugs[2].code).toBe('SORT-002'); // Oldest
    });

    it('should update timestamps on save', async () => {
      const drugData = {
        code: 'TIMESTAMP-001',
        genericName: 'Timestamp Generic',
        brandName: 'Timestamp Brand',
        company: 'Timestamp Company',
        launchDate: new Date('2023-01-01')
      };

      const drug = new Drug(drugData);
      const savedDrug = await drug.save();
      const originalUpdatedAt = savedDrug.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      savedDrug.genericName = 'Updated Generic';
      await savedDrug.save();

      expect(savedDrug.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});