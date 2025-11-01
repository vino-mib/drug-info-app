// Jest setup file for backend tests
require('dotenv').config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/druginfo_test';
process.env.PORT = '0'; // Use dynamic port for testing

// Global test timeout
jest.setTimeout(30000);

const mongoose = require('mongoose');

// Global database connection management
let isConnected = false;
let connectionPromise = null;

// Mock mongoose for unit tests by default
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue({}),
    connection: {
      ...actualMongoose.connection,
      close: jest.fn().mockResolvedValue({}),
      on: jest.fn(),
      once: jest.fn(),
      readyState: 1
    }
  };
});

global.setupTestDB = async () => {
  // For unit tests, we don't actually connect to the database
  if (process.env.JEST_TEST_TYPE !== 'integration') {
    return Promise.resolve();
  }
  
  if (!isConnected && !connectionPromise) {
    connectionPromise = (async () => {
      try {
        const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/druginfo_test';
        await mongoose.connect(mongoUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        isConnected = true;
        return true;
      } catch (error) {
        console.error('Failed to connect to test database:', error);
        isConnected = false;
        connectionPromise = null;
        throw error;
      }
    })();
  }
  
  return connectionPromise;
};

global.teardownTestDB = async () => {
  if (process.env.JEST_TEST_TYPE !== 'integration') {
    return Promise.resolve();
  }
  
  if (isConnected) {
    try {
      await mongoose.connection.close();
      isConnected = false;
      connectionPromise = null;
    } catch (error) {
      console.error('Failed to close test database connection:', error);
    }
  }
};

// Clean up after all tests
afterAll(async () => {
  await global.teardownTestDB();
});

// Mock console methods to reduce noise during tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Only show console messages if explicitly needed
  console.error = (...args) => {
    // Allow specific error messages that are part of tests
    if (args[0] && typeof args[0] === 'string') {
      if (args[0].includes('Error loading data:') || 
          args[0].includes('Error saving data:') ||
          args[0].includes('MongoDB connection error:')) {
        return; // Suppress these expected errors in tests
      }
    }
    originalConsoleError.apply(console, args);
  };

  console.log = (...args) => {
    // Suppress MongoDB connection logs during tests
    if (args[0] && typeof args[0] === 'string') {
      if (args[0].includes('Connected to MongoDB') ||
          args[0].includes('Server is running on port')) {
        return;
      }
    }
    originalConsoleLog.apply(console, args);
  };

  console.warn = (...args) => {
    // Allow warnings but filter out known test warnings
    originalConsoleWarn.apply(console, args);
  };
});

afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
});

// Global test helpers
global.testHelpers = {
  createMockDrug: (overrides = {}) => ({
    code: 'TEST-001',
    genericName: 'Test Generic Name',
    brandName: 'Test Brand Name',
    company: 'Test Company',
    launchDate: new Date('2023-01-01T00:00:00Z'),
    ...overrides
  }),

  createMockDrugs: (count = 3) => {
    return Array.from({ length: count }, (_, index) => ({
      code: `TEST-${String(index + 1).padStart(3, '0')}`,
      genericName: `Test Generic ${index + 1}`,
      brandName: `Test Brand ${index + 1}`,
      company: `Test Company ${index + 1}`,
      launchDate: new Date(`2023-${String(index + 1).padStart(2, '0')}-01T00:00:00Z`)
    }));
  },

  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Cleanup function for database connections
global.cleanupDatabase = async (connection) => {
  if (connection && connection.readyState === 1) {
    try {
      await connection.close();
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
};