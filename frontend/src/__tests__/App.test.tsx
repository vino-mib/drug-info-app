import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock axios before any imports that use it
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    })),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  },
}));

// Mock the drugService
jest.mock('../services/drugService');

import App from '../App';
import { drugService } from '../services/drugService';
const mockDrugService = drugService as jest.Mocked<typeof drugService>;

// Mock theme for Material-UI components
const theme = createTheme();

const MockWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

const mockDrugs = [
  {
    id: '1',
    code: '0006-0568',
    genericName: 'vorinostat',
    brandName: 'ZOLINZA',
    company: 'Merck Sharp & Dohme Corp.',
    launchDate: '2004-02-14T23:01:10Z',
    displayName: 'vorinostat (ZOLINZA)',
    sequentialId: 1
  },
  {
    id: '2',
    code: '68828-192',
    genericName: 'Avobenzone',
    brandName: 'CC Cream',
    company: 'Jafra cosmetics International',
    launchDate: '2011-02-02T08:57:26Z',
    displayName: 'Avobenzone (CC Cream)',
    sequentialId: 2
  }
];

const mockCompanies = [
  'Merck Sharp & Dohme Corp.',
  'Jafra cosmetics International',
  'Pfizer Inc.'
];

const mockTableConfig = {
  columns: [
    { key: 'sequentialId', label: 'Id', sortable: false, visible: true, width: 80 },
    { key: 'code', label: 'Code', sortable: true, visible: true, width: 120 },
    { key: 'displayName', label: 'Name', sortable: true, visible: true, width: 300 },
    { key: 'company', label: 'Company', sortable: true, visible: true, width: 250, clickable: true },
    { key: 'launchDate', label: 'Launch Date', sortable: true, visible: true, width: 120, type: 'date' as const }
  ],
  pagination: {
    defaultPageSize: 50,
    pageSizeOptions: [25, 50, 100, 200]
  },
  sorting: {
    defaultSort: {
      field: 'launchDate',
      direction: 'desc' as const
    }
  }
};

const mockDrugsResponse = {
  drugs: mockDrugs,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 2,
    hasNextPage: false,
    hasPrevPage: false
  }
};

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockDrugService.getTableConfig.mockResolvedValue(mockTableConfig);
    mockDrugService.getCompanies.mockResolvedValue(mockCompanies);
    mockDrugService.getDrugs.mockResolvedValue(mockDrugsResponse);
  });

  it('renders app title and subtitle', async () => {
    render(
      <MockWrapper>
        <App />
      </MockWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading Drug Information...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Drug Information System')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(
      <MockWrapper>
        <App />
      </MockWrapper>
    );

    expect(screen.getByText('Loading Drug Information...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('loads and displays initial data successfully', async () => {
    render(
      <MockWrapper>
        <App />
      </MockWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading Drug Information...')).not.toBeInTheDocument();
    });

    // Check if API calls were made
    expect(mockDrugService.getTableConfig).toHaveBeenCalledTimes(1);
    expect(mockDrugService.getCompanies).toHaveBeenCalledTimes(1);
    expect(mockDrugService.getDrugs).toHaveBeenCalledWith({
      page: 1,
      limit: 50,
      sortBy: 'launchDate',
      sortOrder: 'desc'
    });

    // Check if components are rendered
    expect(screen.getByText('Filter by Company:')).toBeInTheDocument();
    expect(screen.getByText('Drug List')).toBeInTheDocument();
    expect(screen.getByText('Total: 2 drugs')).toBeInTheDocument();
  });

  it('displays error message when initial data loading fails', async () => {
    mockDrugService.getTableConfig.mockRejectedValue(new Error('API Error'));

    render(
      <MockWrapper>
        <App />
      </MockWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load initial data. Please try again.')).toBeInTheDocument();
    });
  });


  it('handles company filtering correctly', async () => {
    const user = userEvent.setup();

    render(
      <MockWrapper>
        <App />
      </MockWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading Drug Information...')).not.toBeInTheDocument();
    });

    // Open company filter dropdown
    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    // Select a company from dropdown
    const companyOption = screen.getByRole('option', { name: 'Merck Sharp & Dohme Corp.' });
    await user.click(companyOption);

    // Wait for the filter to be applied
    await waitFor(() => {
      expect(mockDrugService.getDrugs).toHaveBeenCalledWith({
        company: 'Merck Sharp & Dohme Corp.',
        page: 1,
        limit: 50,
        sortBy: 'launchDate',
        sortOrder: 'desc'
      });
    });
  });

  
  it('handles pagination correctly', async () => {
    const multiPageResponse = {
      ...mockDrugsResponse,
      pagination: { ...mockDrugsResponse.pagination, totalPages: 3, hasNextPage: true }
    };
    mockDrugService.getDrugs.mockResolvedValue(multiPageResponse);

    const user = userEvent.setup();

    render(
      <MockWrapper>
        <App />
      </MockWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading Drug Information...')).not.toBeInTheDocument();
    });

    // Click next page
    const nextButton = screen.getByLabelText('Go to next page');
    await user.click(nextButton);

    await waitFor(() => {
      expect(mockDrugService.getDrugs).toHaveBeenCalledWith({
        company: undefined,
        page: 2,
        limit: 50,
        sortBy: 'launchDate',
        sortOrder: 'desc'
      });
    });
  });

  it('handles company click from table correctly', async () => {
    const user = userEvent.setup();

    render(
      <MockWrapper>
        <App />
      </MockWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading Drug Information...')).not.toBeInTheDocument();
    });

    // Click on a company chip in the table
    const companyChips = screen.getAllByText('Merck Sharp & Dohme Corp.');
    const companyChip = companyChips.find(chip => chip.closest('.MuiChip-root'));
    await user.click(companyChip!);

    // Should trigger company filtering
    await waitFor(() => {
      expect(mockDrugService.getDrugs).toHaveBeenCalledWith({
        company: 'Merck Sharp & Dohme Corp.',
        page: 1,
        limit: 50,
        sortBy: 'launchDate',
        sortOrder: 'desc'
      });
    });
  });

  it('resets to page 1 when company filter changes', async () => {
    const user = userEvent.setup();

    // Mock being on page 2
    const page2Response = {
      ...mockDrugsResponse,
      pagination: { ...mockDrugsResponse.pagination, currentPage: 2, totalPages: 3 }
    };
    mockDrugService.getDrugs.mockResolvedValue(page2Response);

    render(
      <MockWrapper>
        <App />
      </MockWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading Drug Information...')).not.toBeInTheDocument();
    });

    // Simulate being on page 2 by clicking next
    const nextButton = screen.getByLabelText('Go to next page');
    await user.click(nextButton);

    // Now change company filter
    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);
    
    const companyOption = screen.getByRole('option', { name: 'Merck Sharp & Dohme Corp.' });
    await user.click(companyOption);

    // Should call API with page 1 (reset)
    await waitFor(() => {
      expect(mockDrugService.getDrugs).toHaveBeenLastCalledWith({
        company: 'Merck Sharp & Dohme Corp.',
        page: 1,
        limit: 50,
        sortBy: 'launchDate',
        sortOrder: 'desc'
      });
    });
  });

  it('displays total drug count correctly', async () => {
    const responseWithCount = {
      ...mockDrugsResponse,
      pagination: { ...mockDrugsResponse.pagination, totalCount: 1250 }
    };
    mockDrugService.getDrugs.mockResolvedValue(responseWithCount);

    render(
      <MockWrapper>
        <App />
      </MockWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Total: 1,250 drugs')).toBeInTheDocument();
    });
  });

  it('handles loading state during filtering', async () => {
    const user = userEvent.setup();

    // Make getDrugs return a promise that doesn't resolve immediately
    let resolveGetDrugs: (value: any) => void;
    const getDrugsPromise = new Promise<any>((resolve) => {
      resolveGetDrugs = resolve;
    });
    mockDrugService.getDrugs.mockReturnValue(getDrugsPromise);

    render(
      <MockWrapper>
        <App />
      </MockWrapper>
    );

    // Wait for initial load (this will hang until we resolve it)
    // For this test, we'll resolve the initial call first
    resolveGetDrugs!(mockDrugsResponse);

    await waitFor(() => {
      expect(screen.queryByText('Loading Drug Information...')).not.toBeInTheDocument();
    });

    // Now mock a new hanging promise for the filter call
    const filterPromise = new Promise<any>(() => {}); // Never resolves
    mockDrugService.getDrugs.mockReturnValue(filterPromise);

    // Change filter to trigger loading
    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);
    
    const companyOption = screen.getByRole('option', { name: 'Merck Sharp & Dohme Corp.' });
    await user.click(companyOption);

    // Should show loading state in the table
    await waitFor(() => {
      expect(screen.getByText('Loading drugs...')).toBeInTheDocument();
    });
  });

  it('displays error message when drug loading fails', async () => {
    // Mock successful initial calls
    mockDrugService.getTableConfig.mockResolvedValue(mockTableConfig);
    mockDrugService.getCompanies.mockResolvedValue(mockCompanies);
    
    // Mock getDrugs to fail
    mockDrugService.getDrugs.mockRejectedValue(new Error('Failed to load drugs'));

    render(
      <MockWrapper>
        <App />
      </MockWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load initial data. Please try again.')).toBeInTheDocument();
    });
  });
});