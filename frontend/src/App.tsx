import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import DrugTable from './components/DrugTable';
import CompanyFilter from './components/CompanyFilter';
import { Drug, TableConfig } from './types';
import { drugService } from './services/drugService';

const App: React.FC = () => {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [tableConfig, setTableConfig] = useState<TableConfig | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrenPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const initialLoadRef = useRef<boolean>(false);

  // Load initial data
  useEffect(() => {
    if (!initialLoadRef.current) {
      console.log('App mounted, loading initial data...');
      initialLoadRef.current = true;
      loadInitialData();
    }
  }, []);

  // Load drugs when company filter or page changes (only after initial load is complete)
  useEffect(() => {
    if (initialLoadComplete && tableConfig) {
      console.log('Loading drugs due to filter/page change...');
      loadDrugs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, currentPage, initialLoadComplete]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading initial data...');
      
      // Load table configuration and companies in parallel
      const [configData, companiesData] = await Promise.all([
        drugService.getTableConfig(),
        drugService.getCompanies(),
      ]);

      setTableConfig(configData);
      setCompanies(companiesData);

      // Load initial drugs data
      const response = await drugService.getDrugs({
        page: 1,
        limit: configData.pagination.defaultPageSize || 50,
        sortBy: 'launchDate',
        sortOrder: 'desc',
      });

      setDrugs(response.drugs);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
      setInitialLoadComplete(true);
    } catch (err) {
      setError('Failed to load initial data. Please try again.');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDrugs = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await drugService.getDrugs({
        company: selectedCompany || undefined,
        page: currentPage,
        limit: tableConfig?.pagination.defaultPageSize || 50,
        sortBy: 'launchDate',
        sortOrder: 'desc',
      });

      setDrugs(response.drugs);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (err) {
      setError('Failed to load drug data. Please try again.');
      console.error('Error loading drugs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyFilter = (company: string) => {
    setSelectedCompany(company);
    setCurrenPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (newPage: number) => {
    setCurrenPage(newPage);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();
      return `${day}.${month}.${year}`;
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading && !tableConfig) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading Drug Information...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Drug Information System
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <CompanyFilter
            companies={companies}
            selectedCompany={selectedCompany}
            onFilterChange={handleCompanyFilter}
            disabled={loading}
          />
        </Box>

        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Drug List
            {selectedCompany && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                (Filtered by: {selectedCompany})
              </Typography>
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total: {totalCount.toLocaleString()} drugs
          </Typography>
        </Box>

        {tableConfig && (
          <DrugTable
            drugs={drugs}
            tableConfig={tableConfig}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            onCompanyClick={handleCompanyFilter}
            onPageChange={handlePageChange}
            formatDate={formatDate}
          />
        )}
      </Paper>
    </Container>
  );
};

export default App;