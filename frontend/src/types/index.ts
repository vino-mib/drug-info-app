export interface Drug {
  id: string;
  code: string;
  genericName: string;
  brandName: string;
  company: string;
  launchDate: string;
  displayName: string;
  sequentialId: number;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  visible: boolean;
  width?: number;
  clickable?: boolean;
  type?: 'date' | 'string' | 'number';
}

export interface TableConfig {
  columns: TableColumn[];
  pagination: {
    defaultPageSize: number;
    pageSizeOptions: number[];
  };
  sorting: {
    defaultSort: {
      field: string;
      direction: 'asc' | 'desc';
    };
  };
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface DrugsResponse {
  drugs: Drug[];
  pagination: PaginationInfo;
}

export interface CompaniesResponse {
  companies: string[];
}

export interface ApiError {
  error: string;
}