/**
 * Raffle service for managing contestant data and raffle operations
 * Handles local storage of raffle data and provides utility functions
 */

import { csvService, CSVMapping, CSVRow } from './csv';

/**
 * Clear all raffle data from localStorage
 * This function removes:
 * - CSV imports
 * - Raffle results
 * - Contestant data
 * 
 * But preserves:
 * - User preferences
 * - CSV mappings (just the formats, not the data)
 * - Theme settings
 * 
 * @param userId User ID to clear data for
 * @returns Object with count of items cleared
 */
export const clearRaffles = (userId: string): { success: boolean, cleared: Record<string, number> } => {
  if (!userId) {
    console.error('Cannot clear raffles: No user ID provided');
    return { success: false, cleared: {} };
  }

  const cleared: Record<string, number> = {};

  try {
    // Clear CSV imports
    const importsKey = `csv_imports_${userId}`;
    const importsData = localStorage.getItem(importsKey);
    if (importsData) {
      const imports = JSON.parse(importsData);
      cleared.imports = imports.length;
      localStorage.removeItem(importsKey);
    }

    // Clear raffle results
    const resultsKey = `spinpick_results_${userId}`;
    const resultsData = localStorage.getItem(resultsKey);
    if (resultsData) {
      const results = JSON.parse(resultsData);
      cleared.results = results.length;
      localStorage.removeItem(resultsKey);
    }

    // Clear contestant data keys (any key that looks like contestant data)
    const contestantPrefix = `contestants_${userId}`;
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(contestantPrefix)) {
        keysToRemove.push(key);
      }
    }
    
    cleared.contestants = keysToRemove.length;
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Clear any other raffle-related data
    const rafflePrefixes = [
      `raffle_data_${userId}`,
      `raffle_state_${userId}`,
      `recent_winners_${userId}`
    ];
    
    let otherCount = 0;
    rafflePrefixes.forEach(prefix => {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          localStorage.removeItem(key);
          otherCount++;
        }
      }
    });
    
    if (otherCount > 0) {
      cleared.other = otherCount;
    }

    console.log(`Cleared raffle data for user ${userId}:`, cleared);
    return { success: true, cleared };
  } catch (error) {
    console.error('Error clearing raffle data:', error);
    return { success: false, cleared };
  }
};

/**
 * Raffle service for managing contestants and raffle operations
 */
class RaffleService {
  /**
   * Load contestants from localStorage
   * @param userId User ID
   * @param raffleId Optional raffle ID (defaults to 'default')
   * @returns Array of contestants or empty array if none found
   */
  loadContestants(userId: string, raffleId: string = 'default'): CSVRow[] {
    if (!userId) return [];
    
    try {
      const key = `contestants_${userId}_${raffleId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading contestants:', error);
      return [];
    }
  }

  /**
   * Save contestants to localStorage
   * @param userId User ID
   * @param contestants Array of contestant data
   * @param raffleId Optional raffle ID (defaults to 'default')
   * @returns Boolean indicating success
   */
  saveContestants(userId: string, contestants: CSVRow[], raffleId: string = 'default'): boolean {
    if (!userId) return false;
    
    try {
      const key = `contestants_${userId}_${raffleId}`;
      localStorage.setItem(key, JSON.stringify(contestants));
      return true;
    } catch (error) {
      console.error('Error saving contestants:', error);
      return false;
    }
  }

  /**
   * Import contestants from CSV data
   * @param userId User ID
   * @param csvData CSV string content
   * @param mapping CSV mapping configuration
   * @param raffleId Optional raffle ID (defaults to 'default')
   * @returns Object with import results
   */
  importFromCSV(
    userId: string, 
    csvData: string, 
    mapping: CSVMapping,
    raffleId: string = 'default'
  ): { success: boolean, contestants: CSVRow[] } {
    if (!userId || !csvData || !mapping) {
      return { success: false, contestants: [] };
    }
    
    try {
      // Parse CSV using CSV service
      const contestants = csvService.parseCSV(csvData, mapping);
      
      // Save to localStorage
      this.saveContestants(userId, contestants, raffleId);
      
      // Record the import in localStorage
      try {
        const importData = {
          id: `import_${Date.now()}`,
          mapping_id: mapping.id || 'unknown',
          filename: `import_${new Date().toISOString()}`,
          row_count: contestants.length,
          imported_at: new Date().toISOString()
        };
        
        const importsKey = `csv_imports_${userId}`;
        const existingImports = localStorage.getItem(importsKey);
        const imports = existingImports ? JSON.parse(existingImports) : [];
        imports.unshift(importData); // Add to beginning of array
        
        // Only keep last 10 imports in history
        if (imports.length > 10) {
          imports.length = 10;
        }
        
        localStorage.setItem(importsKey, JSON.stringify(imports));
      } catch (e) {
        console.warn('Could not save import history:', e);
      }
      
      return { success: true, contestants };
    } catch (error) {
      console.error('Error importing from CSV:', error);
      return { success: false, contestants: [] };
    }
  }

  /**
   * Clear all contestants for a specific raffle
   * @param userId User ID
   * @param raffleId Optional raffle ID (defaults to 'default')
   * @returns Boolean indicating success
   */
  clearContestants(userId: string, raffleId: string = 'default'): boolean {
    if (!userId) return false;
    
    try {
      const key = `contestants_${userId}_${raffleId}`;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error clearing contestants:', error);
      return false;
    }
  }

  /**
   * Save a raffle result to localStorage
   * @param userId User ID
   * @param winner Winner information
   * @param type Type of randomizer used (wheel or slot)
   * @returns Boolean indicating success
   */
  saveResult(
    userId: string,
    winner: string | Record<string, string>,
    type: 'wheel' | 'slot'
  ): boolean {
    if (!userId) return false;
    
    try {
      const key = `spinpick_results_${userId}`;
      const existingResults = localStorage.getItem(key);
      const results = existingResults ? JSON.parse(existingResults) : [];
      
      results.unshift({
        id: `result_${Date.now()}`,
        result: winner,
        type,
        timestamp: new Date().toISOString()
      });
      
      // Limit to 50 results
      if (results.length > 50) {
        results.length = 50;
      }
      
      localStorage.setItem(key, JSON.stringify(results));
      return true;
    } catch (error) {
      console.error('Error saving result:', error);
      return false;
    }
  }

  /**
   * Get raffle results from localStorage
   * @param userId User ID
   * @param limit Optional limit on number of results to return
   * @returns Array of results or empty array if none found
   */
  getResults(userId: string, limit?: number): any[] {
    if (!userId) return [];
    
    try {
      const key = `spinpick_results_${userId}`;
      const data = localStorage.getItem(key);
      let results = data ? JSON.parse(data) : [];
      
      if (limit && results.length > limit) {
        results = results.slice(0, limit);
      }
      
      return results;
    } catch (error) {
      console.error('Error getting results:', error);
      return [];
    }
  }

  /**
   * Clear all raffle data for a user
   * @param userId User ID
   * @returns Result of clearing operation
   */
  clearAllRaffleData(userId: string) {
    return clearRaffles(userId);
  }
}

// Export the singleton instance
export const raffleService = new RaffleService();
export default raffleService;