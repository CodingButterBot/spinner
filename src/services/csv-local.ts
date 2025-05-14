/**
 * @file CSV Service using PapaParse - LocalStorage Only Edition
 * @description Handles CSV file parsing, column mapping, and data import for contestant management
 */

import Papa from 'papaparse';
import { useDirectusAuth } from './directus-auth';

/**
 * Configuration for mapping CSV columns to contestant properties
 * @interface CSVMapping
 */
export interface CSVMapping {
  /** Optional unique identifier for the mapping */
  id?: string;

  /** Display name for this mapping configuration */
  name: string;

  /** Column name or index for contestant names */
  name_column: string;

  /** Column name or index for ticket numbers */
  ticket_column: string;

  /** Optional column name or index for email addresses */
  email_column?: string;

  /** Optional additional columns to extract */
  additional_columns?: Record<string, string>;

  /** Whether the CSV file has a header row */
  has_header_row: boolean;

  /** Character used to separate columns */
  delimiter: ',' | ';' | '\t' | '|';
}

/**
 * Record of a CSV import operation
 * @interface CSVImport
 */
export interface CSVImport {
  /** Optional unique identifier for the import */
  id?: string;

  /** ID of the mapping configuration used */
  mapping_id: string;

  /** Original filename */
  filename: string;

  /** Number of rows imported */
  row_count: number;

  /** Timestamp of the import */
  imported_at?: string;
}

/**
 * Generic row of CSV data with string key-value pairs
 * @interface CSVRow
 */
export interface CSVRow {
  [key: string]: string;
}

/**
 * React hook for using CSV services with localStorage
 * @returns CSV service functions
 */
export const useCSV = () => {
  const { user, isAuthenticated } = useDirectusAuth();

  /**
   * Parse a CSV string into an array of mapped objects
   * @param {string} csv - CSV string content to parse
   * @param {CSVMapping} mapping - Column mapping configuration
   * @returns {CSVRow[]} Array of row objects with mapped columns
   */
  const parseCSV = (csv: string, mapping: CSVMapping): CSVRow[] => {
    // Handle empty input
    if (!csv?.trim()) return [];

    // Use PapaParse to parse the CSV
    const parseResult = Papa.parse(csv, {
      header: mapping.has_header_row,
      delimiter: mapping.delimiter === '\t' ? '\t' : mapping.delimiter,
      skipEmptyLines: true,
      transformHeader: header => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing warnings:', parseResult.errors);
    }

    // Map the parsed data to our expected format
    return parseResult.data.map((row: any) => {
      const item: CSVRow = {};

      // Add core fields based on mapping
      if (mapping.has_header_row) {
        // When headers are used, map by column names
        item.name = row[mapping.name_column] || '';
        item.ticket = row[mapping.ticket_column] || '';
        
        if (mapping.email_column) {
          item.email = row[mapping.email_column] || '';
        }

        // Add additional mapped columns
        if (mapping.additional_columns) {
          Object.entries(mapping.additional_columns).forEach(([field, colName]) => {
            item[field] = row[colName] || '';
          });
        }
      } else {
        // When no headers, map by column indices
        const columns = Object.values(row);
        const nameIdx = parseInt(mapping.name_column) - 1;
        const ticketIdx = parseInt(mapping.ticket_column) - 1;
        
        item.name = (nameIdx >= 0 && nameIdx < columns.length) ? columns[nameIdx] : '';
        item.ticket = (ticketIdx >= 0 && ticketIdx < columns.length) ? columns[ticketIdx] : '';
        
        if (mapping.email_column) {
          const emailIdx = parseInt(mapping.email_column) - 1;
          if (emailIdx >= 0 && emailIdx < columns.length) {
            item.email = columns[emailIdx];
          }
        }

        // Add additional mapped columns
        if (mapping.additional_columns) {
          Object.entries(mapping.additional_columns).forEach(([field, colIdx]) => {
            const idx = parseInt(colIdx) - 1;
            if (idx >= 0 && idx < columns.length) {
              item[field] = columns[idx];
            }
          });
        }
      }

      return item;
    });
  };

  /**
   * Extract column headers from a CSV file
   * @param {string} csv - CSV file content
   * @param {string} [delimiter=','] - Column delimiter character
   * @returns {string[]} Array of column headers or first row values
   */
  const getCSVHeaders = (csv: string, delimiter: string = ','): string[] => {
    if (!csv?.trim()) return [];

    // Use PapaParse to parse just the first row
    const parseResult = Papa.parse(csv, {
      delimiter: delimiter === '\t' ? '\t' : delimiter,
      preview: 1, // Only parse the first line
      skipEmptyLines: true,
    });

    if (parseResult.data.length === 0 || !Array.isArray(parseResult.data[0])) {
      return [];
    }

    return parseResult.data[0].map(header => header.trim());
  };

  /**
   * Get saved mappings for a user
   * @returns {Promise<CSVMapping[]>} Promise with user's saved mappings
   */
  const getMappings = async (): Promise<CSVMapping[]> => {
    if (!user) return [];

    try {
      // Get from localStorage
      const key = `csv_mappings_${user.id}`;
      const storedMappings = localStorage.getItem(key);
      return storedMappings ? JSON.parse(storedMappings) : [];
    } catch (error) {
      console.error('Failed to get CSV mappings:', error);
      return []; // Return empty array in case of error
    }
  };

  /**
   * Create a new CSV mapping configuration
   * @param {CSVMapping} mapping - Mapping configuration
   * @returns {Promise<CSVMapping>} Promise with created mapping
   */
  const createMapping = async (mapping: CSVMapping): Promise<CSVMapping> => {
    if (!user) throw new Error('User must be authenticated to create mappings');

    try {
      // Generate ID if not provided
      const mappingWithId = {
        ...mapping,
        id: mapping.id || `mapping_${Date.now()}`
      };

      // Save to localStorage
      const key = `csv_mappings_${user.id}`;
      const existingMappings = await getMappings();
      const updatedMappings = [...existingMappings, mappingWithId];
      localStorage.setItem(key, JSON.stringify(updatedMappings));
      
      return mappingWithId;
    } catch (error) {
      console.error('Failed to create CSV mapping:', error);
      return mapping; // Return original mapping in case of error
    }
  };

  /**
   * Delete a CSV mapping configuration
   * @param {string} mappingId - ID of the mapping to delete
   * @returns {Promise<boolean>} Promise indicating success
   */
  const deleteMapping = async (mappingId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const key = `csv_mappings_${user.id}`;
      const existingMappings = await getMappings();
      const updatedMappings = existingMappings.filter(m => m.id !== mappingId);
      
      // Only update if we actually removed something
      if (updatedMappings.length !== existingMappings.length) {
        localStorage.setItem(key, JSON.stringify(updatedMappings));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to delete CSV mapping:', error);
      return false;
    }
  };

  /**
   * Record a CSV import in the import history
   * @param {string} mappingId - ID of the mapping used
   * @param {string} filename - Name of the imported file
   * @param {number} rowCount - Number of rows imported
   * @returns {Promise<CSVImport>} Promise with the import record
   */
  const recordImport = async (
    mappingId: string, 
    filename: string, 
    rowCount: number
  ): Promise<CSVImport> => {
    if (!user) throw new Error('User must be authenticated to record imports');

    try {
      const importData: CSVImport = {
        id: `import_${Date.now()}`,
        mapping_id: mappingId,
        filename,
        row_count: rowCount,
        imported_at: new Date().toISOString()
      };

      // Save to localStorage
      const key = `csv_imports_${user.id}`;
      const storedImports = localStorage.getItem(key);
      const existingImports = storedImports ? JSON.parse(storedImports) : [];
      const updatedImports = [importData, ...existingImports];
      
      // Limit history to 20 imports
      if (updatedImports.length > 20) {
        updatedImports.length = 20;
      }
      
      localStorage.setItem(key, JSON.stringify(updatedImports));
      return importData;
    } catch (error) {
      console.error('Failed to record CSV import:', error);
      
      // Return a minimal record in case of error
      return {
        id: `import_error_${Date.now()}`,
        mapping_id: mappingId,
        filename,
        row_count: rowCount
      };
    }
  };

  /**
   * Get saved CSV imports
   * @param {number} [limit] - Optional limit for number of imports to return
   * @returns {Promise<CSVImport[]>} Promise with user's saved imports
   */
  const getImports = async (limit?: number): Promise<CSVImport[]> => {
    if (!user) return [];

    try {
      const key = `csv_imports_${user.id}`;
      const storedImports = localStorage.getItem(key);
      if (!storedImports) return [];
      
      let imports = JSON.parse(storedImports);
      if (limit && imports.length > limit) {
        imports = imports.slice(0, limit);
      }
      
      return imports;
    } catch (error) {
      console.error('Failed to get CSV imports:', error);
      return []; // Return empty array in case of error
    }
  };

  /**
   * Clear all CSV import history
   * @returns {Promise<boolean>} Promise indicating success
   */
  const clearImportHistory = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const key = `csv_imports_${user.id}`;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to clear import history:', error);
      return false;
    }
  };

  return {
    parseCSV,
    getCSVHeaders,
    getMappings,
    createMapping,
    deleteMapping,
    recordImport,
    getImports,
    clearImportHistory
  };
};

// Legacy singleton service for backward compatibility
class CSVService {
  parseCSV(csv: string, mapping: CSVMapping): CSVRow[] {
    // Handle empty input
    if (!csv?.trim()) return [];

    // Use PapaParse to parse the CSV
    const parseResult = Papa.parse(csv, {
      header: mapping.has_header_row,
      delimiter: mapping.delimiter === '\t' ? '\t' : mapping.delimiter,
      skipEmptyLines: true,
      transformHeader: header => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing warnings:', parseResult.errors);
    }

    // Map the parsed data to our expected format
    return parseResult.data.map((row: any) => {
      const item: CSVRow = {};

      // Add core fields based on mapping
      if (mapping.has_header_row) {
        // When headers are used, map by column names
        item.name = row[mapping.name_column] || '';
        item.ticket = row[mapping.ticket_column] || '';
        
        if (mapping.email_column) {
          item.email = row[mapping.email_column] || '';
        }

        // Add additional mapped columns
        if (mapping.additional_columns) {
          Object.entries(mapping.additional_columns).forEach(([field, colName]) => {
            item[field] = row[colName] || '';
          });
        }
      } else {
        // When no headers, map by column indices
        const columns = Object.values(row);
        const nameIdx = parseInt(mapping.name_column) - 1;
        const ticketIdx = parseInt(mapping.ticket_column) - 1;
        
        item.name = (nameIdx >= 0 && nameIdx < columns.length) ? columns[nameIdx] : '';
        item.ticket = (ticketIdx >= 0 && ticketIdx < columns.length) ? columns[ticketIdx] : '';
        
        if (mapping.email_column) {
          const emailIdx = parseInt(mapping.email_column) - 1;
          if (emailIdx >= 0 && emailIdx < columns.length) {
            item.email = columns[emailIdx];
          }
        }

        // Add additional mapped columns
        if (mapping.additional_columns) {
          Object.entries(mapping.additional_columns).forEach(([field, colIdx]) => {
            const idx = parseInt(colIdx) - 1;
            if (idx >= 0 && idx < columns.length) {
              item[field] = columns[idx];
            }
          });
        }
      }

      return item;
    });
  }

  getCSVHeaders(csv: string, delimiter: string = ','): string[] {
    if (!csv?.trim()) return [];

    // Use PapaParse to parse just the first row
    const parseResult = Papa.parse(csv, {
      delimiter: delimiter === '\t' ? '\t' : delimiter,
      preview: 1, // Only parse the first line
      skipEmptyLines: true,
    });

    if (parseResult.data.length === 0 || !Array.isArray(parseResult.data[0])) {
      return [];
    }

    return parseResult.data[0].map(header => header.trim());
  }

  async getMappings(userId: string): Promise<CSVMapping[]> {
    try {
      // Get from localStorage
      const key = `csv_mappings_${userId}`;
      const storedMappings = localStorage.getItem(key);
      return storedMappings ? JSON.parse(storedMappings) : [];
    } catch (error) {
      console.error('Failed to get CSV mappings:', error);
      return []; // Return empty array in case of error
    }
  }

  async createMapping(userId: string, mapping: CSVMapping): Promise<CSVMapping> {
    try {
      // Generate ID if not provided
      const mappingWithId = {
        ...mapping,
        id: mapping.id || `mapping_${Date.now()}`
      };

      // Save to localStorage
      const key = `csv_mappings_${userId}`;
      const existingMappings = await this.getMappings(userId);
      const updatedMappings = [...existingMappings, mappingWithId];
      localStorage.setItem(key, JSON.stringify(updatedMappings));
      
      return mappingWithId;
    } catch (error) {
      console.error('Failed to create CSV mapping:', error);
      return mapping; // Return original mapping in case of error
    }
  }
}

// Export singleton instance for backward compatibility
export const csvService = new CSVService();
export default csvService;