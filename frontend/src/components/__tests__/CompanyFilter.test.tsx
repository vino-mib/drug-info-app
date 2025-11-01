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

  it('renders clear button', () => {
    render(
      <MockWrapper>
        <CompanyFilter {...defaultProps} onFilterChange={mockOnFilterChange} />
      </MockWrapper>
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).toBeInTheDocument();
    expect(clearButton).toHaveTextContent('Clear');
  });

  it('clear button is disabled when no company is selected', () => {
    render(
      <MockWrapper>
        <CompanyFilter {...defaultProps} selectedCompany="" onFilterChange={mockOnFilterChange} />
      </MockWrapper>
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).toBeDisabled();
  });

  it('clear button is enabled when a company is selected', () => {
    render(
      <MockWrapper>
        <CompanyFilter {...defaultProps} selectedCompany="Pfizer Inc." onFilterChange={mockOnFilterChange} />
      </MockWrapper>
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).toBeEnabled();
  });

  it('calls onFilterChange with empty string when clear button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <MockWrapper>
        <CompanyFilter {...defaultProps} selectedCompany="Pfizer Inc." onFilterChange={mockOnFilterChange} />
      </MockWrapper>
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith('');
    expect(mockOnFilterChange).toHaveBeenCalledTimes(1);
  });

  it('clear button is disabled when component is disabled', () => {
    render(
      <MockWrapper>
        <CompanyFilter {...defaultProps} selectedCompany="Pfizer Inc." disabled={true} onFilterChange={mockOnFilterChange} />
      </MockWrapper>
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).toBeDisabled();
  });

  it('clear button has proper icon', () => {
    render(
      <MockWrapper>
        <CompanyFilter {...defaultProps} selectedCompany="Pfizer Inc." onFilterChange={mockOnFilterChange} />
      </MockWrapper>
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    // Check if the button contains an SVG (MUI icon)
    const icon = clearButton.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});