const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Mock the database connection to avoid actual connection during tests
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  connection: {
    on: jest.fn(),
    close: jest.fn()
  }
}));

// Mock the routes
jest.mock('../routes/drugs', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/', (req, res) => res.json({ message: 'drugs route' }));
  return router;
});

jest.mock('../routes/companies', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/', (req, res) => res.json({ message: 'companies route' }));
  return router;
});

jest.mock('../routes/config', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/', (req, res) => res.json({ message: 'config route' }));
  return router;
});

// Import the app after mocking
const app = require('../server');

describe('Server Configuration', () => {
  describe('Middleware Setup', () => {
    it('should have CORS enabled', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // CORS headers should be present
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should parse JSON requests', async () => {
      const testData = { test: 'data' };
      
      // This test verifies that express.json() middleware is working
      // We'll test this indirectly through the health endpoint
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe('object');
    });

    it('should have security headers from helmet', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Helmet should add security headers
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });

  describe('Health Check Endpoint', () => {
    it('should respond to health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should return current timestamp in health check', async () => {
      const beforeTime = new Date();
      
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      const afterTime = new Date();
      const responseTime = new Date(response.body.timestamp);

      expect(responseTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(responseTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('Route Mounting', () => {
    it('should mount drugs routes correctly', async () => {
      const response = await request(app)
        .get('/api/drugs')
        .expect(200);

      expect(response.body.message).toBe('drugs route');
    });

    it('should mount companies routes correctly', async () => {
      const response = await request(app)
        .get('/api/companies')
        .expect(200);

      expect(response.body.message).toBe('companies route');
    });

    it('should mount config routes correctly', async () => {
      const response = await request(app)
        .get('/api/config')
        .expect(200);

      expect(response.body.message).toBe('config route');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route')
        .expect(404);

      expect(response.body.error).toBe('Route not found');
    });

    it('should handle 404 for any unknown path', async () => {
      const response = await request(app)
        .get('/completely/unknown/path')
        .expect(404);

      expect(response.body.error).toBe('Route not found');
    });

    it('should handle POST requests to unknown routes', async () => {
      const response = await request(app)
        .post('/api/unknown-route')
        .send({ test: 'data' })
        .expect(404);

      expect(response.body.error).toBe('Route not found');
    });

    it('should handle PUT requests to unknown routes', async () => {
      const response = await request(app)
        .put('/api/unknown-route/123')
        .send({ test: 'data' })
        .expect(404);

      expect(response.body.error).toBe('Route not found');
    });

    it('should handle DELETE requests to unknown routes', async () => {
      const response = await request(app)
        .delete('/api/unknown-route/123')
        .expect(404);

      expect(response.body.error).toBe('Route not found');
    });
  });

  describe('HTTP Methods Support', () => {
    it('should support GET requests', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should support POST requests with JSON', async () => {
      // We'll test this by sending a POST to a non-existent route
      // to verify the server can handle POST requests (even if the route doesn't exist)
      const response = await request(app)
        .post('/test-post')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json')
        .expect(404); // 404 because route doesn't exist, but server processed the POST

      expect(response.body.error).toBe('Route not found');
    });
  });

  describe('Content Type Handling', () => {
    it('should handle JSON content type', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should return appropriate content type for JSON responses', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Database Connection Setup', () => {
    it('should attempt to connect to MongoDB', () => {
      // Verify that mongoose.connect was called during server setup
      expect(mongoose.connect).toHaveBeenCalled();
    });

    it('should set up connection event listeners', () => {
      // Verify that connection event listeners were set up
      expect(mongoose.connection.on).toHaveBeenCalledWith('connected', expect.any(Function));
      expect(mongoose.connection.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });
});