import { DrugsResponse, TableConfig } from '../../types';

// Mock axios completely
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn()
      },
      response: {
        use: jest.fn()
      }
    }
  }))
}));

import axios from 'axios';
import { drugService } from '../drugService';

// Get the mocked instance
const mockAxiosInstance = (axios.create as jest.Mock).mock.results[0].value;

describe('DrugService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDrugs', () => {
    const mockDrugsResponse: DrugsResponse = {
      drugs: [
        {
          id: '1',
          code: '0006-0568',
          genericName: 'vorinostat',
          brandName: 'ZOLINZA',
          company: 'Merck Sharp & Dohme Corp.',
          launchDate: '2004-02-14T23:01:10Z',
          displayName: 'vorinostat (ZOLINZA)',
          sequentialId: 1
        }
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 1,
        hasNextPage: false,
        hasPrevPage: false
      }
    };

    it('fetches drugs without parameters', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockDrugsResponse });

      const result = await drugService.getDrugs();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/drugs', { params: {} });
      expect(result).toEqual(mockDrugsResponse);
    });

    it('fetches drugs with company filter', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockDrugsResponse });

      const params = { company: 'Merck Sharp & Dohme Corp.' };
      const result = await drugService.getDrugs(params);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/drugs', { params });
      expect(result).toEqual(mockDrugsResponse);
    });

    it('fetches drugs with pagination parameters', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockDrugsResponse });

      const params = { page: 2, limit: 25 };
      const result = await drugService.getDrugs(params);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/drugs', { params });
      expect(result).toEqual(mockDrugsResponse);
    });

    it('fetches drugs with sorting parameters', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockDrugsResponse });

      const params = { sortBy: 'company', sortOrder: 'asc' as const };
      const result = await drugService.getDrugs(params);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/drugs', { params });
      expect(result).toEqual(mockDrugsResponse);
    });

    it('fetches drugs with all parameters', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockDrugsResponse });

      const params = {
        company: 'Pfizer Inc.',
        page: 3,
        limit: 100,
        sortBy: 'launchDate',
        sortOrder: 'desc' as const
      };
      const result = await drugService.getDrugs(params);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/drugs', { params });
      expect(result).toEqual(mockDrugsResponse);
    });

    it('handles API errors gracefully', async () => {
      const errorMessage = 'Network Error';
      mockAxiosInstance.get.mockRejectedValue(new Error(errorMessage));

      await expect(drugService.getDrugs()).rejects.toThrow(errorMessage);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/drugs', { params: {} });
    });
  });

  describe('getDrug', () => {
    const mockDrug = {
      id: '1',
      code: '0006-0568',
      genericName: 'vorinostat',
      brandName: 'ZOLINZA',
      company: 'Merck Sharp & Dohme Corp.',
      launchDate: '2004-02-14T23:01:10Z',
      displayName: 'vorinostat (ZOLINZA)',
      sequentialId: 1
    };

    it('fetches a single drug by ID', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockDrug });

      const result = await drugService.getDrug('1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/drugs/1');
      expect(result).toEqual(mockDrug);
    });

    it('handles errors when fetching single drug', async () => {
      const errorMessage = 'Drug not found';
      mockAxiosInstance.get.mockRejectedValue(new Error(errorMessage));

      await expect(drugService.getDrug('999')).rejects.toThrow(errorMessage);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/drugs/999');
    });
  });

  describe('getCompanies', () => {
    const mockCompanies = [
      'Merck Sharp & Dohme Corp.',
      'Pfizer Inc.',
      'Johnson & Johnson'
    ];

    it('fetches list of companies', async () => {
      mockAxiosInstance.get.mockResolvedValue({ 
        data: { companies: mockCompanies } 
      });

      const result = await drugService.getCompanies();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/companies');
      expect(result).toEqual(mockCompanies);
    });

    it('handles errors when fetching companies', async () => {
      const errorMessage = 'Failed to fetch companies';
      mockAxiosInstance.get.mockRejectedValue(new Error(errorMessage));

      await expect(drugService.getCompanies()).rejects.toThrow(errorMessage);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/companies');
    });
  });

  describe('getTableConfig', () => {
    const mockTableConfig: TableConfig = {
      columns: [
        { key: 'sequentialId', label: 'Id', sortable: false, visible: true, width: 80 },
        { key: 'code', label: 'Code', sortable: true, visible: true, width: 120 },
        { key: 'displayName', label: 'Name', sortable: true, visible: true, width: 300 },
        { key: 'company', label: 'Company', sortable: true, visible: true, width: 250, clickable: true },
        { key: 'launchDate', label: 'Launch Date', sortable: true, visible: true, width: 120, type: 'date' }
      ],
      pagination: {
        defaultPageSize: 50,
        pageSizeOptions: [25, 50, 100, 200]
      },
      sorting: {
        defaultSort: {
          field: 'launchDate',
          direction: 'desc'
        }
      }
    };

    it('fetches table configuration', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockTableConfig });

      const result = await drugService.getTableConfig();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/config');
      expect(result).toEqual(mockTableConfig);
    });

    it('handles errors when fetching table config', async () => {
      const errorMessage = 'Failed to fetch config';
      mockAxiosInstance.get.mockRejectedValue(new Error(errorMessage));

      await expect(drugService.getTableConfig()).rejects.toThrow(errorMessage);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/config');
    });
  });



  describe('API error handling', () => {
    it('handles network errors', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.get.mockRejectedValue(networkError);

      await expect(drugService.getDrugs()).rejects.toThrow('Network Error');
    });

    it('handles HTTP errors', async () => {
      const httpError = {
        response: {
          status: 500,
          data: { error: 'Internal Server Error' }
        }
      };
      mockAxiosInstance.get.mockRejectedValue(httpError);

      await expect(drugService.getDrugs()).rejects.toEqual(httpError);
    });

    it('handles timeout errors', async () => {
      const timeoutError = new Error('timeout of 10000ms exceeded');
      mockAxiosInstance.get.mockRejectedValue(timeoutError);

      await expect(drugService.getDrugs()).rejects.toThrow('timeout of 10000ms exceeded');
    });
  });

  describe('parameter validation', () => {
    it('handles undefined parameters gracefully', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { drugs: [], pagination: {} } });

      const params = {
        company: undefined,
        page: undefined,
        limit: undefined,
        sortBy: undefined,
        sortOrder: undefined
      };

      await drugService.getDrugs(params);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/drugs', { params });
    });

    it('handles empty string parameters', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { drugs: [], pagination: {} } });

      const params = {
        company: '',
        sortBy: '',
        sortOrder: 'asc' as const
      };

      await drugService.getDrugs(params);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/drugs', { params });
    });
  });

  describe('response data validation', () => {
    it('returns response data directly', async () => {
      const mockResponse = { drugs: [], pagination: { totalCount: 0 } };
      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      const result = await drugService.getDrugs();

      expect(result).toEqual(mockResponse);
    });

    it('handles malformed response data', async () => {
      const malformedResponse = { data: null };
      mockAxiosInstance.get.mockResolvedValue(malformedResponse);

      const result = await drugService.getDrugs();

      expect(result).toBeNull();
    });
  });
});