/**
 * @file CSV Service using PapaParse
 * @description Handles CSV file parsing, column mapping, and data import for contestant management
 */

import { apiService } from './api';
import Papa from 'papaparse';

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

  /** Imported data rows */
  data: any[];

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
 * Service for handling CSV import operations using PapaParse
 * @class CSVService
 */
class CSVService {
  /**
   * Parse a CSV string into an array of mapped objects
   * @param {string} csv - CSV string content to parse
   * @param {CSVMapping} mapping - Column mapping configuration
   * @returns {CSVRow[]} Array of row objects with mapped columns
   * @example
   * // Parse CSV with a specific mapping configuration
   * const mapping = {
   *   name: "RaffleMapping",
   *   name_column: "Contestant",
   *   ticket_column: "TicketNo",
   *   email_column: "Email",
   *   has_header_row: true,
   *   delimiter: ","
   * };
   *
   * const csvData = csvService.parseCSV(fileContent, mapping);
   * // csvData will be an array of objects like:
   * // [{ name: "John Smith", ticket: "12345", email: "john@example.com" }, ...]
   */
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

  /**
   * Extract column headers from a CSV file
   * @param {string} csv - CSV file content
   * @param {string} [delimiter=','] - Column delimiter character
   * @returns {string[]} Array of column headers or first row values
   * @example
   * // Get available columns from a CSV
   * const headers = csvService.getCSVHeaders(fileContent);
   * console.log("Available columns:", headers);
   */
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

  /**
   * Get saved mappings for a user
   * @param {string} userId - User ID
   * @returns {Promise<CSVMapping[]>} Promise with user's saved mappings
   */
  async getMappings(userId: string): Promise<CSVMapping[]> {
    try {
      // Try to fetch from local storage first as fallback
      const storedMappings = localStorage.getItem(`csv_mappings_${userId}`);
      if (storedMappings) {
        return JSON.parse(storedMappings);
      }

      // Then try API
      return await apiService.get(`/csv/mappings/${userId}`);
    } catch (error) {
      console.error('Failed to get CSV mappings:', error);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Create a new CSV mapping configuration
   * @param {string} userId - User ID
   * @param {CSVMapping} mapping - Mapping configuration
   * @returns {Promise<CSVMapping>} Promise with created mapping
   */
  async createMapping(userId: string, mapping: CSVMapping): Promise<CSVMapping> {
    try {
      // Generate ID if not provided
      const mappingWithId = {
        ...mapping,
        id: mapping.id || `mapping_${Date.now()}`
      };

      // Try to save to local storage as fallback
      try {
        const existingMappings = await this.getMappings(userId);
        const updatedMappings = [...existingMappings, mappingWithId];
        localStorage.setItem(`csv_mappings_${userId}`, JSON.stringify(updatedMappings));
      } catch (e) {
        console.warn('Could not save mapping to localStorage:', e);
      }

      // Then try API
      const result = await apiService.post('/csv/mappings', {
        userId,
        mappingData: mappingWithId
      });

      return result;
    } catch (error) {
      console.error('Failed to create CSV mapping:', error);
      return mapping; // Return original mapping instead of throwing
    }
  }

  /**
   * Import parsed CSV data
   * @param {string} userId - User ID
   * @param {string} mappingId - Mapping configuration ID
   * @param {string} filename - Original filename
   * @param {any[]} data - Parsed CSV data
   * @returns {Promise<CSVImport>} Promise with import result
   */
  async importCSV(userId: string, mappingId: string, filename: string, data: any[]): Promise<CSVImport> {
    try {
      // Create import record
      const importData: CSVImport = {
        id: `import_${Date.now()}`,
        mapping_id: mappingId,
        filename,
        data,
        row_count: data.length,
        imported_at: new Date().toISOString()
      };

      // Try to save to local storage as fallback
      try {
        const storedImports = localStorage.getItem(`csv_imports_${userId}`);
        const existingImports = storedImports ? JSON.parse(storedImports) : [];
        const updatedImports = [...existingImports, importData];
        localStorage.setItem(`csv_imports_${userId}`, JSON.stringify(updatedImports));
      } catch (e) {
        console.warn('Could not save import to localStorage:', e);
      }

      // Then try API
      const result = await apiService.post('/csv/imports', {
        userId,
        mappingId,
        filename,
        data
      });

      return result;
    } catch (error) {
      console.error('Failed to import CSV:', error);
      // Return a minimal import record instead of throwing
      return {
        mapping_id: mappingId,
        filename,
        data,
        row_count: data.length
      };
    }
  }
}

// Export singleton instance
export const csvService = new CSVService();
export default csvService;