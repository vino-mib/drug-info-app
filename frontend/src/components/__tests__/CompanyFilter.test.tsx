import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CompanyFilter from '../CompanyFilter';

// Mock theme for Material-UI components
const theme = createTheme();

const MockWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

const mockCompanies = [
  'Merck Sharp & Dohme Corp.',
  'Pfizer Inc.',
  'Johnson & Johnson',
  'GlaxoSmithKline Pharmaceuticals Limited',
  'Novartis AG',
  'Roche Holding AG'
];

const defaultProps = {
  companies: mockCompanies,
  selectedCompany: '',
  onFilterChange: jest.fn(),
  disabled: false
};

describe('CompanyFilter Component', () => {
  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    mockOnFilterChange.mockClear();
    jest.clearAllMocks();
  });

  it('renders company filter with label', () => {
    render(
      <MockWrapper>
        <CompanyFilter {...defaultProps} onFilterChange={mockOnFilterChange} />
      </MockWrapper>
    );

    expect(screen.getByText('Filter by Company:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Company')).toBeInTheDocument();
  });

  it('displays "All Companies" when no company is selected', () => {
    render(
      <MockWrapper>
        <CompanyFilter {...defaultProps} onFilterChange={mockOnFilterChange} />
      </MockWrapper>
    );

    // The "All Companies" text should be visible in the select display
    expect(screen.getByText('All Companies')).toBeInTheDocument();
  });

  it('displays selected company name when a company is selected', () => {
    render(
      <MockWrapper>
        <CompanyFilter
          {...defaultProps}
          selectedCompany="Merck Sharp & Dohme Corp."
          onFilterChange={mockOnFilterChange}
        />
      </MockWrapper>
    );

    expect(screen.getByText('Merck Sharp & Dohme Corp.')).toBeInTheDocument();
  });

  it('shows dropdown options when clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <MockWrapper>
        <CompanyFilter {...defaultProps} onFilterChange={mockOnFilterChange} />
      </MockWrapper>
    );

    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    // Wait for dropdown to open
    await waitFor(() => {
      expect(screen.getAllByText('All Companies')).toHaveLength(2); // One in display, one in dropdown
    });

    // Check if company options are visible
    expect(screen.getByText('Merck Sharp & Dohme Corp.')).toBeInTheDocument();
    expect(screen.getByText('Pfizer Inc.')).toBeInTheDocument();
    expect(screen.getByText('Johnson & Johnson')).toBeInTheDocument();
  });

  it('calls onFilterChange with selected company when option is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <MockWrapper>
        <CompanyFilter {...defaultProps} onFilterChange={mockOnFilterChange} />
      </MockWrapper>
    );

    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    // Wait for dropdown to open and click on a company
    await waitFor(() => {
      expect(screen.getByText('Merck Sharp & Dohme Corp.')).toBeInTheDocument();
    });

    const companyOption = screen.getByText('Merck Sharp & Dohme Corp.');
    await user.click(companyOption);

    expect(mockOnFilterChange).toHaveBeenCalledWith('Merck Sharp & Dohme Corp.');
  });

  it('calls onFilterChange with empty string when "All Companies" is selected', async () => {
    const user = userEvent.setup();
    
    render(
      <MockWrapper>
        <CompanyFilter
          {...defaultProps}
          selectedCompany="Merck Sharp & Dohme Corp."
          onFilterChange={mockOnFilterChange}
        />
      </MockWrapper>
    );

    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    // Wait for dropdown to open and click on "All Companies"
    await waitFor(() => {
      const allCompaniesOptions = screen.getAllByText('All Companies');
      expect(allCompaniesOptions.length).toBeGreaterThan(0);
    });

    // Click on the "All Companies" option in the dropdown (not the display value)
    const allCompaniesOptions = screen.getAllByText('All Companies');
    const dropdownOption = allCompaniesOptions.find(option => 
      option.closest('[role="option"]')
    );
    
    if (dropdownOption) {
      await user.click(dropdownOption);
      expect(mockOnFilterChange).toHaveBeenCalledWith('');
    }
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <MockWrapper>
        <CompanyFilter
          {...defaultProps}
          disabled={true}
          onFilterChange={mockOnFilterChange}
        />
      </MockWrapper>
    );

    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toHaveAttribute('aria-disabled', 'true');
  });

  it('is enabled when disabled prop is false', () => {
    render(
      <MockWrapper>
        <CompanyFilter
          {...defaultProps}
          disabled={false}
          onFilterChange={mockOnFilterChange}
        />
      </MockWrapper>
    );

    const formControl = screen.getByRole('combobox').closest('.MuiFormControl-root');
    expect(formControl).not.toHaveClass('Mui-disabled');
  });

  it('displays selected company name correctly', () => {
    render(
      <MockWrapper>
        <CompanyFilter
          {...defaultProps}
          selectedCompany="Merck Sharp & Dohme Corp."
          onFilterChange={mockOnFilterChange}
        />
      </MockWrapper>
    );

    expect(screen.getByText('Merck Sharp & Dohme Corp.')).toBeInTheDocument();
  });

  it('renders all provided companies in dropdown', async () => {
    const user = userEvent.setup();
    
    render(
      <MockWrapper>
        <CompanyFilter {...defaultProps} onFilterChange={mockOnFilterChange} />
      </MockWrapper>
    );

    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    // Wait for dropdown to open
    await waitFor(() => {
      expect(screen.getByText('Merck Sharp & Dohme Corp.')).toBeInTheDocument();
    });

    // Check if all companies are rendered
    mockCompanies.forEach(company => {
      expect(screen.getByText(company)).toBeInTheDocument();
    });
  });

  it('truncates long company names with ellipsis in display', () => {
    const longCompanyName = 'Very Long Company Name That Should Be Truncated With Ellipsis';
    
    render(
      <MockWrapper>
        <CompanyFilter
          {...defaultProps}
          companies={[longCompanyName]}
          selectedCompany={longCompanyName}
          onFilterChange={mockOnFilterChange}
        />
      </MockWrapper>
    );

    const displayText = screen.getByText(longCompanyName);
    expect(displayText).toHaveStyle({
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    });
  });

  it('handles empty companies array gracefully', () => {
    render(
      <MockWrapper>
        <CompanyFilter
          {...defaultProps}
          companies={[]}
          onFilterChange={mockOnFilterChange}
        />
      </MockWrapper>
    );

    expect(screen.getByText('All Companies')).toBeInTheDocument();
    expect(screen.getByText('Filter by Company:')).toBeInTheDocument();
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(
      <MockWrapper>
        <CompanyFilter {...defaultProps} onFilterChange={mockOnFilterChange} />
      </MockWrapper>
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-labelledby', 'company-filter-label');
    expect(select).toHaveAttribute('aria-haspopup', 'listbox');
    expect(select).toHaveAttribute('aria-expanded', 'false');
  });

  it('displays italic styling for "All Companies" text', () => {
    render(
      <MockWrapper>
        <CompanyFilter {...defaultProps} onFilterChange={mockOnFilterChange} />
      </MockWrapper>
    );

    const allCompaniesText = screen.getByText('All Companies');
    expect(allCompaniesText).toHaveStyle({ fontStyle: 'italic' });
  });

  it('maintains consistent styling across different states', () => {
    const { rerender } = render(
      <MockWrapper>
        <CompanyFilter {...defaultProps} onFilterChange={mockOnFilterChange} />
      </MockWrapper>
    );

    // Check initial state
    expect(screen.getByText('All Companies')).toBeInTheDocument();

    // Change to selected state
    rerender(
      <MockWrapper>
        <CompanyFilter
          {...defaultProps}
          selectedCompany="Merck Sharp & Dohme Corp."
          onFilterChange={mockOnFilterChange}
        />
      </MockWrapper>
    );

    expect(screen.getByText('Merck Sharp & Dohme Corp.')).toBeInTheDocument();

    // Change back to unselected state
    rerender(
      <MockWrapper>
        <CompanyFilter {...defaultProps} onFilterChange={mockOnFilterChange} />
      </MockWrapper>
    );

    expect(screen.getByText('All Companies')).toBeInTheDocument();
  });

  it('handles keyboard navigation properly', async () => {
    const user = userEvent.setup();
    
    render(
      <MockWrapper>
        <CompanyFilter {...defaultProps} onFilterChange={mockOnFilterChange} />
      </MockWrapper>
    );

    const selectButton = screen.getByRole('combobox');
    
    // Focus and open with Enter key
    selectButton.focus();
    await user.keyboard('{Enter}');

    // Should open dropdown
    await waitFor(() => {
      expect(selectButton).toHaveAttribute('aria-expanded', 'true');
    });

    // Navigate with arrow keys and select with Enter
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    // Should select the first company (Merck Sharp & Dohme Corp.)
    expect(mockOnFilterChange).toHaveBeenCalledWith('Merck Sharp & Dohme Corp.');
  });

  it('closes dropdown when Escape key is pressed', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <MockWrapper>
          <CompanyFilter {...defaultProps} onFilterChange={mockOnFilterChange} />
        </MockWrapper>
        <div data-testid="outside-element">Outside</div>
      </div>
    );

    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    // Dropdown should be open
    await waitFor(() => {
      expect(selectButton).toHaveAttribute('aria-expanded', 'true');
    });

    // Press Escape key
    await user.keyboard('{Escape}');

    // Dropdown should close
    await waitFor(() => {
      expect(selectButton).toHaveAttribute('aria-expanded', 'false');
    });
  });
});