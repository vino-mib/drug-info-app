import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  CircularProgress,
  Box,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import { FilterList as FilterIcon } from '@mui/icons-material';
import { Drug, TableConfig } from '../types';

interface DrugTableProps {
  drugs: Drug[];
  tableConfig: TableConfig;
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onCompanyClick: (company: string) => void;
  onPageChange: (page: number) => void;
  formatDate: (dateString: string) => string;
}

const DrugTable: React.FC<DrugTableProps> = ({
  drugs,
  tableConfig,
  loading,
  currentPage,
  totalPages,
  onCompanyClick,
  onPageChange,
  formatDate,
}) => {
  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange(newPage + 1); // MUI uses 0-based pagination, our API uses 1-based
  };

  const handleCompanyClick = (company: string) => {
    onCompanyClick(company);
  };

  const renderCellContent = (drug: Drug, column: any) => {
    const value = drug[column.key as keyof Drug];

    switch (column.key) {
      case 'displayName':
        return (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {drug.displayName}
          </Typography>
        );

      case 'company':
        return (
          <Chip
            label={drug.company}
            variant="outlined"
            clickable
            onClick={() => handleCompanyClick(drug.company)}
            sx={{
              cursor: 'pointer',
              maxWidth: '100%',
              height: 'auto',
              minHeight: '32px',
              '& .MuiChip-label': {
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                lineHeight: 1.2,
                padding: '4px 8px',
              },
              '&:hover': {
                backgroundColor: 'primary.light',
                color: 'black',
              },
            }}
            icon={<FilterIcon fontSize="small" />}
          />
        );

      case 'launchDate':
        return (
          <Typography variant="body2" color="text.secondary">
            {formatDate(drug.launchDate)}
          </Typography>
        );

      case 'sequentialId':
        return (
          <Typography variant="body2" color="text.secondary">
            {drug.sequentialId}
          </Typography>
        );

      case 'code':
        return (
          <Typography variant="body2" fontFamily="monospace">
            {drug.code}
          </Typography>
        );

      default:
        return (
          <Typography variant="body2">
            {value?.toString() || '—'}
          </Typography>
        );
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading drugs...
        </Typography>
      </Box>
    );
  }

  if (drugs.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <Typography variant="h6" color="text.secondary">
          No drugs found
        </Typography>
      </Box>
    );
  }

  const pageSize = tableConfig.pagination.defaultPageSize;

  return (
    <TableContainer component={Paper} elevation={1}>
      <Table stickyHeader sx={{ tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            {tableConfig.columns
              .filter((column) => column.visible)
              .map((column) => (
                <TableCell
                  key={column.key}
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: 'grey.50',
                    width: column.width,
                    minWidth: column.width,
                    maxWidth: column.width,
                  }}
                >
                  <Box display="flex" alignItems="center">
                    {column.label}
                    {column.clickable && (
                      <Tooltip title="Click company names to filter">
                        <FilterIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {drugs.map((drug) => (
            <TableRow key={drug.id} hover>
              {tableConfig.columns
                .filter((column) => column.visible)
                .map((column) => (
                  <TableCell 
                    key={`${drug.id}-${column.key}`}
                    sx={{
                      width: column.width,
                      minWidth: column.width,
                      maxWidth: column.width,
                      overflow: 'hidden',
                      ...(column.key === 'company' && {
                        paddingY: 1,
                      }),
                    }}
                  >
                    {renderCellContent(drug, column)}
                  </TableCell>
                ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={-1} // Unknown total count, we'll use server-side pagination
        page={currentPage - 1} // Convert from 1-based to 0-based
        onPageChange={handleChangePage}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[pageSize]} // Fixed page size for now
        labelDisplayedRows={({ from, to }) => 
          `${from}-${to} of many`
        }
        showFirstButton
        showLastButton={false}
        nextIconButtonProps={{
          disabled: currentPage >= totalPages,
        }}
      />
    </TableContainer>
  );
};

export default DrugTable;