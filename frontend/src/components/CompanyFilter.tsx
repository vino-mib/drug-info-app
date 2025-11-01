import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  SelectChangeEvent,
  Button,
} from '@mui/material';
import { Business as BusinessIcon, Clear as ClearIcon } from '@mui/icons-material';

interface CompanyFilterProps {
  companies: string[];
  selectedCompany: string;
  onFilterChange: (company: string) => void;
  disabled?: boolean;
}

const CompanyFilter: React.FC<CompanyFilterProps> = ({
  companies,
  selectedCompany,
  onFilterChange,
  disabled = false,
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onFilterChange(event.target.value);
  };

  const handleClear = () => {
    onFilterChange('');
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Typography variant="h6" sx={{ minWidth: 'auto' }}>
        Filter by Company:
      </Typography>
      
      <FormControl sx={{ width: 500 }} disabled={disabled}>
        <InputLabel id="company-filter-label">Select Company</InputLabel>
        <Select
          labelId="company-filter-label"
          value={selectedCompany}
          label="Select Company"
          onChange={handleChange}
          renderValue={(selected) => {
            return (
              <Typography
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {selected}
              </Typography>
            );
          }}
        >
          <MenuItem value="">
            <Typography sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              All Companies
            </Typography>
          </MenuItem>
          {companies.map((company) => (
            <MenuItem key={company} value={company}>
              {company}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Button
        variant="outlined"
        color="secondary"
        startIcon={<ClearIcon />}
        onClick={handleClear}
        disabled={disabled || !selectedCompany}
        sx={{ minWidth: 'auto', height: '56px' }}
      >
        Clear
      </Button>
    </Box>
  );
};

export default CompanyFilter;