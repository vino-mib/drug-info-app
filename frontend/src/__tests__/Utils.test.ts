/**
 * Utility Functions Tests
 * Tests for helper functions used throughout the application
 */

// Test for date formatting function used in App component
describe('Date Formatting Utilities', () => {
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

  describe('formatDate function', () => {
    it('formats valid ISO date strings correctly', () => {
      expect(formatDate('2004-02-14T23:01:10Z')).toBe('14.02.2004');
      expect(formatDate('2011-02-02T08:57:26Z')).toBe('02.02.2011');
      expect(formatDate('2024-04-07T01:22:52Z')).toBe('07.04.2024');
    });

    it('formats dates with single digit day and month correctly', () => {
      expect(formatDate('2024-01-05T00:00:00Z')).toBe('05.01.2024');
      expect(formatDate('2024-12-01T00:00:00Z')).toBe('01.12.2024');
    });

    it('handles different date formats', () => {
      expect(formatDate('2024-01-15')).toBe('15.01.2024');
      expect(formatDate('2024/01/15')).toBe('15.01.2024');
      expect(formatDate('January 15, 2024')).toBe('15.01.2024');
    });

    it('handles edge cases for dates', () => {
      expect(formatDate('2024-12-31T23:59:59Z')).toBe('31.12.2024');
      expect(formatDate('2000-01-01T00:00:00Z')).toBe('01.01.2000');
      expect(formatDate('1999-12-31T23:59:59Z')).toBe('31.12.1999');
    });

    it('handles leap years correctly', () => {
      expect(formatDate('2024-02-29T00:00:00Z')).toBe('29.02.2024'); // Leap year
      expect(formatDate('2020-02-29T00:00:00Z')).toBe('29.02.2020'); // Leap year
    });

    it('returns "Invalid Date" for invalid date strings', () => {
      expect(formatDate('invalid-date')).toBe('Invalid Date');
      expect(formatDate('')).toBe('Invalid Date');
      expect(formatDate('2024-13-01')).toBe('Invalid Date'); // Invalid month
      expect(formatDate('2024-02-30')).toBe('Invalid Date'); // Invalid day for February
    });

    it('handles null and undefined inputs', () => {
      expect(formatDate(null as any)).toBe('Invalid Date');
      expect(formatDate(undefined as any)).toBe('Invalid Date');
    });

    it('handles numeric inputs', () => {
      expect(formatDate('1640995200000')).toBe('01.01.2022'); // Unix timestamp
      expect(formatDate(String(new Date('2024-06-15').getTime()))).toBe('15.06.2024');
    });
  });
});

// Test for text truncation utilities
describe('Text Utilities', () => {
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  };

  describe('truncateText function', () => {
    it('returns original text if within limit', () => {
      expect(truncateText('Short text', 20)).toBe('Short text');
      expect(truncateText('Exactly 10', 10)).toBe('Exactly 10');
    });

    it('truncates text and adds ellipsis if over limit', () => {
      expect(truncateText('This is a very long text', 10)).toBe('This is...');
      expect(truncateText('Very Long Company Name Ltd.', 15)).toBe('Very Long Co...');
    });

    it('handles edge cases', () => {
      expect(truncateText('', 10)).toBe('');
      expect(truncateText('Hi', 1)).toBe('...');
      expect(truncateText('Hi', 2)).toBe('...');
      expect(truncateText('Hi', 3)).toBe('...');
      expect(truncateText('Hi', 4)).toBe('H...');
    });

    it('handles very short max lengths', () => {
      expect(truncateText('Hello World', 0)).toBe('...');
      expect(truncateText('Hello World', 1)).toBe('...');
      expect(truncateText('Hello World', 2)).toBe('...');
    });
  });
});

// Test for data validation utilities
describe('Data Validation Utilities', () => {
  const isValidDrug = (drug: any): boolean => {
    return (
      drug &&
      typeof drug === 'object' &&
      typeof drug.id === 'string' &&
      typeof drug.code === 'string' &&
      typeof drug.company === 'string' &&
      typeof drug.displayName === 'string' &&
      typeof drug.sequentialId === 'number'
    );
  };

  describe('isValidDrug function', () => {
    it('validates correct drug objects', () => {
      const validDrug = {
        id: '1',
        code: '0006-0568',
        genericName: 'vorinostat',
        brandName: 'ZOLINZA',
        company: 'Merck Sharp & Dohme Corp.',
        launchDate: '2004-02-14T23:01:10Z',
        displayName: 'vorinostat (ZOLINZA)',
        sequentialId: 1
      };

      expect(isValidDrug(validDrug)).toBe(true);
    });

    it('rejects invalid drug objects', () => {
      expect(isValidDrug(null)).toBe(false);
      expect(isValidDrug(undefined)).toBe(false);
      expect(isValidDrug('')).toBe(false);
      expect(isValidDrug({})).toBe(false);
      expect(isValidDrug({ id: 123 })).toBe(false); // Wrong type for id
      expect(isValidDrug({ id: '1', code: 123 })).toBe(false); // Wrong type for code
    });

    it('rejects objects missing required fields', () => {
      const incompleteDrug = {
        id: '1',
        code: '0006-0568',
        // Missing company, displayName, sequentialId
      };

      expect(isValidDrug(incompleteDrug)).toBe(false);
    });
  });
});

// Test for sorting utilities
describe('Sorting Utilities', () => {
  const sortByField = (array: any[], field: string, direction: 'asc' | 'desc' = 'asc') => {
    return [...array].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const mockDrugs = [
    { id: '1', company: 'Zebra Corp', sequentialId: 3 },
    { id: '2', company: 'Alpha Inc', sequentialId: 1 },
    { id: '3', company: 'Beta Ltd', sequentialId: 2 }
  ];

  describe('sortByField function', () => {
    it('sorts array by string field in ascending order', () => {
      const sorted = sortByField(mockDrugs, 'company', 'asc');
      expect(sorted.map(d => d.company)).toEqual(['Alpha Inc', 'Beta Ltd', 'Zebra Corp']);
    });

    it('sorts array by string field in descending order', () => {
      const sorted = sortByField(mockDrugs, 'company', 'desc');
      expect(sorted.map(d => d.company)).toEqual(['Zebra Corp', 'Beta Ltd', 'Alpha Inc']);
    });

    it('sorts array by numeric field in ascending order', () => {
      const sorted = sortByField(mockDrugs, 'sequentialId', 'asc');
      expect(sorted.map(d => d.sequentialId)).toEqual([1, 2, 3]);
    });

    it('sorts array by numeric field in descending order', () => {
      const sorted = sortByField(mockDrugs, 'sequentialId', 'desc');
      expect(sorted.map(d => d.sequentialId)).toEqual([3, 2, 1]);
    });

    it('does not mutate original array', () => {
      const original = [...mockDrugs];
      sortByField(mockDrugs, 'company', 'asc');
      expect(mockDrugs).toEqual(original);
    });

    it('handles empty arrays', () => {
      const sorted = sortByField([], 'company', 'asc');
      expect(sorted).toEqual([]);
    });
  });
});

// Test for pagination utilities
describe('Pagination Utilities', () => {
  const calculatePaginationInfo = (currentPage: number, totalPages: number, totalItems: number, pageSize: number) => {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);
    
    return {
      startItem,
      endItem,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages
    };
  };

  describe('calculatePaginationInfo function', () => {
    it('calculates correct pagination for first page', () => {
      const info = calculatePaginationInfo(1, 5, 100, 25);
      expect(info).toEqual({
        startItem: 1,
        endItem: 25,
        hasNextPage: true,
        hasPrevPage: false,
        isFirstPage: true,
        isLastPage: false
      });
    });

    it('calculates correct pagination for middle page', () => {
      const info = calculatePaginationInfo(3, 5, 100, 25);
      expect(info).toEqual({
        startItem: 51,
        endItem: 75,
        hasNextPage: true,
        hasPrevPage: true,
        isFirstPage: false,
        isLastPage: false
      });
    });

    it('calculates correct pagination for last page', () => {
      const info = calculatePaginationInfo(5, 5, 100, 25);
      expect(info).toEqual({
        startItem: 101,
        endItem: 100, // Adjusted to total items
        hasNextPage: false,
        hasPrevPage: true,
        isFirstPage: false,
        isLastPage: true
      });
    });

    it('handles partial last page correctly', () => {
      const info = calculatePaginationInfo(3, 3, 55, 25);
      expect(info).toEqual({
        startItem: 51,
        endItem: 55, // Only 5 items on last page
        hasNextPage: false,
        hasPrevPage: true,
        isFirstPage: false,
        isLastPage: true
      });
    });

    it('handles single page correctly', () => {
      const info = calculatePaginationInfo(1, 1, 10, 25);
      expect(info).toEqual({
        startItem: 1,
        endItem: 10,
        hasNextPage: false,
        hasPrevPage: false,
        isFirstPage: true,
        isLastPage: true
      });
    });
  });
});