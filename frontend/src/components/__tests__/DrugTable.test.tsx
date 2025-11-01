import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DrugTable from '../DrugTable';
import { Drug, TableConfig } from '../../types';

// Mock theme for Material-UI components
const theme = createTheme();

const MockWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

const mockDrugs: Drug[] = [
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
    genericName: 'Avobenzone, Octinoxate, Octisalate, Octocrylene',
    brandName: 'CC Cream Complexion Corrector Medium Dark',
    company: 'Jafra cosmetics International',
    launchDate: '2011-02-02T08:57:26Z',
    displayName: 'Avobenzone, Octinoxate, Octisalate, Octocrylene (CC Cream Complexion Corrector Medium Dark)',
    sequentialId: 2
  },
  {
    id: '3',
    code: '52125-617',
    genericName: 'Valacyclovir hydrochloride',
    brandName: 'Valacyclovir hydrochloride',
    company: 'REMEDYREPACK INC.',
    launchDate: '2024-04-07T01:22:52Z',
    displayName: 'Valacyclovir hydrochloride (Valacyclovir hydrochloride)',
    sequentialId: 3
  }
];

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

const defaultProps = {
  drugs: mockDrugs,
  tableConfig: mockTableConfig,
  loading: false,
  currentPage: 1,
  totalPages: 1,
  onCompanyClick: jest.fn(),
  onPageChange: jest.fn(),
  formatDate: (dateString: string) => new Date(dateString).toLocaleDateString()
};

describe('DrugTable Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders table with drug data correctly', () => {
    render(
      <MockWrapper>
        <DrugTable {...defaultProps} />
      </MockWrapper>
    );

    // Check if table headers are rendered
    expect(screen.getByText('Id')).toBeInTheDocument();
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Launch Date')).toBeInTheDocument();

    // Check if drug data is rendered
    expect(screen.getByText('vorinostat (ZOLINZA)')).toBeInTheDocument();
    expect(screen.getByText('0006-0568')).toBeInTheDocument();
    expect(screen.getByText('Merck Sharp & Dohme Corp.')).toBeInTheDocument();
  });

  it('displays loading state when loading prop is true', () => {
    render(
      <MockWrapper>
        <DrugTable {...defaultProps} loading={true} />
      </MockWrapper>
    );

    expect(screen.getByText('Loading drugs...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays empty state when no drugs are provided', () => {
    render(
      <MockWrapper>
        <DrugTable {...defaultProps} drugs={[]} />
      </MockWrapper>
    );

    expect(screen.getByText('No drugs found')).toBeInTheDocument();
  });

  it('calls onCompanyClick when company chip is clicked', async () => {
    const user = userEvent.setup();
    const mockOnCompanyClick = jest.fn();

    render(
      <MockWrapper>
        <DrugTable {...defaultProps} onCompanyClick={mockOnCompanyClick} />
      </MockWrapper>
    );

    // Find and click the company chip
    const companyChip = screen.getByText('Merck Sharp & Dohme Corp.');
    await user.click(companyChip);

    expect(mockOnCompanyClick).toHaveBeenCalledWith('Merck Sharp & Dohme Corp.');
  });

  it('formats dates correctly using the provided formatDate function', () => {
    const mockFormatDate = jest.fn((dateString) => '14.02.2004');

    render(
      <MockWrapper>
        <DrugTable {...defaultProps} formatDate={mockFormatDate} />
      </MockWrapper>
    );

    expect(mockFormatDate).toHaveBeenCalledWith('2004-02-14T23:01:10Z');
    expect(screen.getAllByText('14.02.2004').length).toBeGreaterThan(0);
  });

  it('handles pagination correctly', async () => {
    const user = userEvent.setup();
    const mockOnPageChange = jest.fn();

    render(
      <MockWrapper>
        <DrugTable 
          {...defaultProps} 
          totalPages={3}
          currentPage={1}
          onPageChange={mockOnPageChange} 
        />
      </MockWrapper>
    );

    // Find the next page button and click it
    const nextButton = screen.getByLabelText('Go to next page');
    await user.click(nextButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('displays sequential IDs correctly', () => {
    render(
      <MockWrapper>
        <DrugTable {...defaultProps} />
      </MockWrapper>
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders drug codes in monospace font', () => {
    render(
      <MockWrapper>
        <DrugTable {...defaultProps} />
      </MockWrapper>
    );

    const codeCell = screen.getByText('0006-0568');
    expect(codeCell).toHaveStyle({ fontFamily: 'monospace' });
  });

  it('renders all visible columns only', () => {
    const configWithHiddenColumn = {
      ...mockTableConfig,
      columns: mockTableConfig.columns.map(col => 
        col.key === 'code' ? { ...col, visible: false } : col
      )
    };

    render(
      <MockWrapper>
        <DrugTable {...defaultProps} tableConfig={configWithHiddenColumn} />
      </MockWrapper>
    );

    // Code column header should not be visible
    expect(screen.queryByText('Code')).not.toBeInTheDocument();
    // But other columns should be visible
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
  });

  it('displays filter icon for clickable columns', () => {
    render(
      <MockWrapper>
        <DrugTable {...defaultProps} />
      </MockWrapper>
    );

    // Company column should have a filter icon tooltip
    expect(screen.getByLabelText('Click company names to filter')).toBeInTheDocument();
  });

  it('shows correct pagination information', () => {
    render(
      <MockWrapper>
        <DrugTable 
          {...defaultProps}
          currentPage={1}
          totalPages={5}
        />
      </MockWrapper>
    );

    // Check that pagination component is rendered
    // Material-UI TablePagination renders text like "1–3 of 6" 
    expect(screen.getByText(/of/)).toBeInTheDocument();
  });

  it('disables next button on last page', () => {
    render(
      <MockWrapper>
        <DrugTable 
          {...defaultProps}
          currentPage={3}
          totalPages={3}
        />
      </MockWrapper>
    );

    const nextButton = screen.getByLabelText('Go to next page');
    expect(nextButton).toBeDisabled();
  });

  it('enables next button when not on last page', () => {
    render(
      <MockWrapper>
        <DrugTable 
          {...defaultProps}
          currentPage={1}
          totalPages={3}
        />
      </MockWrapper>
    );

    const nextButton = screen.getByLabelText('Go to next page');
    expect(nextButton).not.toBeDisabled();
  });
});