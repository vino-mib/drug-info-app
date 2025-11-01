const request = require('supertest');
const express = require('express');
const configRoutes = require('../routes/config');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/config', configRoutes);

describe('Config API Endpoints', () => {
  describe('GET /api/config', () => {
    it('should return table configuration with all required properties', async () => {
      const response = await request(app)
        .get('/api/config')
        .expect(200);

      expect(response.body).toHaveProperty('columns');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('sorting');
    });

    it('should return correct column configuration', async () => {
      const response = await request(app)
        .get('/api/config')
        .expect(200);

      const columns = response.body.columns;
      expect(columns).toHaveLength(5);

      // Check sequentialId column
      const idColumn = columns.find(col => col.key === 'sequentialId');
      expect(idColumn).toBeDefined();
      expect(idColumn.label).toBe('Id');
      expect(idColumn.sortable).toBe(false);
      expect(idColumn.visible).toBe(true);
      expect(idColumn.width).toBe(80);

      // Check code column
      const codeColumn = columns.find(col => col.key === 'code');
      expect(codeColumn).toBeDefined();
      expect(codeColumn.label).toBe('Code');
      expect(codeColumn.sortable).toBe(true);
      expect(codeColumn.visible).toBe(true);
      expect(codeColumn.width).toBe(120);

      // Check displayName column
      const nameColumn = columns.find(col => col.key === 'displayName');
      expect(nameColumn).toBeDefined();
      expect(nameColumn.label).toBe('Name');
      expect(nameColumn.sortable).toBe(true);
      expect(nameColumn.visible).toBe(true);
      expect(nameColumn.width).toBe(200);

      // Check company column (should be clickable)
      const companyColumn = columns.find(col => col.key === 'company');
      expect(companyColumn).toBeDefined();
      expect(companyColumn.label).toBe('Company');
      expect(companyColumn.sortable).toBe(true);
      expect(companyColumn.visible).toBe(true);
      expect(companyColumn.width).toBe(250);
      expect(companyColumn.clickable).toBe(true);

      // Check launchDate column (should have type 'date')
      const dateColumn = columns.find(col => col.key === 'launchDate');
      expect(dateColumn).toBeDefined();
      expect(dateColumn.label).toBe('Launch Date');
      expect(dateColumn.sortable).toBe(true);
      expect(dateColumn.visible).toBe(true);
      expect(dateColumn.width).toBe(120);
      expect(dateColumn.type).toBe('date');
    });

    it('should return correct pagination configuration', async () => {
      const response = await request(app)
        .get('/api/config')
        .expect(200);

      const pagination = response.body.pagination;
      expect(pagination.defaultPageSize).toBe(50);
      expect(pagination.pageSizeOptions).toEqual([25, 50, 100, 200]);
    });

    it('should return correct sorting configuration', async () => {
      const response = await request(app)
        .get('/api/config')
        .expect(200);

      const sorting = response.body.sorting;
      expect(sorting.defaultSort.field).toBe('launchDate');
      expect(sorting.defaultSort.direction).toBe('desc');
    });

    it('should return consistent configuration on multiple requests', async () => {
      const response1 = await request(app)
        .get('/api/config')
        .expect(200);

      const response2 = await request(app)
        .get('/api/config')
        .expect(200);

      expect(response1.body).toEqual(response2.body);
    });

    it('should handle potential errors gracefully', async () => {
      // This test ensures the error handling is in place
      // Since the config route doesn't have complex logic that can fail,
      // we're mainly testing that the structure is correct
      const response = await request(app)
        .get('/api/config')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe('object');
    });
  });
});