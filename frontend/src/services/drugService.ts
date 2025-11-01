import axios from 'axios';
import { DrugsResponse, CompaniesResponse, TableConfig } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making API request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const drugService = {
  // Get drugs with optional filtering and pagination
  getDrugs: async (params: {
    company?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<DrugsResponse> => {
    const response = await api.get('/drugs', { params });
    return response.data;
  },

  // Get single drug by ID
  getDrug: async (id: string) => {
    const response = await api.get(`/drugs/${id}`);
    return response.data;
  },

  // Get all unique companies
  getCompanies: async (): Promise<string[]> => {
    const response = await api.get<CompaniesResponse>('/companies');
    return response.data.companies;
  },

  // Get table configuration
  getTableConfig: async (): Promise<TableConfig> => {
    const response = await api.get<TableConfig>('/config');
    return response.data;
  },
};

export default drugService;