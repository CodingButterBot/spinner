/**
 * @file Contestant service for SpinPick
 * @description Handles raffle contestant data from CSV imports and provides methods to access and manipulate contestants
 */

import { CSVRow } from './csv';

/**
 * Represents a raffle contestant with their information
 * @interface Contestant
 */
export interface Contestant {
  /** Unique identifier for the contestant */
  id: string;

  /** Contestant's name displayed on the wheel */
  name: string;

  /** Ticket number used to look up and reveal winners */
  ticket: string;

  /** Optional email address for contact information */
  email?: string;

  /** Any additional data from the CSV import stored as key-value pairs */
  data?: Record<string, string>;
}

/** Key used for storing contestants in localStorage */
const STORAGE_KEY = 'spinpick_contestants';

/**
 * Service for managing raffle contestant data
 * @class ContestantService
 */
class ContestantService {
  /** Array of all loaded contestants */
  private contestants: Contestant[] = [];

  /**
   * Creates the contestant service and loads any existing contestants
   */
  constructor() {
    this.loadContestants();
  }

  /**
   * Loads contestants from localStorage if available
   * @private
   */
  private loadContestants(): void {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        this.contestants = JSON.parse(storedData);
      }
    } catch (error) {
      console.error('Failed to load contestants:', error);
      this.contestants = [];
    }
  }

  /**
   * Saves the current contestants to localStorage
   * @private
   */
  private saveContestants(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.contestants));
    } catch (error) {
      console.error('Failed to save contestants:', error);
    }
  }

  /**
   * Gets all contestants currently loaded
   * @returns {Contestant[]} A copy of the contestants array
   * @example
   * // Get all contestants to display in a list
   * const allContestants = contestantService.getAllContestants();
   * allContestants.forEach(contestant => console.log(`${contestant.name}: ${contestant.ticket}`));
   */
  getAllContestants(): Contestant[] {
    return [...this.contestants];
  }

  /**
   * Updates contestants from imported CSV data
   * @param {CSVRow[]} csvData - Array of CSV rows with mapped data
   * @returns {number} The number of contestants successfully imported
   * @example
   * // Import contestants from CSV data
   * const csvData = csvService.parseCSV(fileContent, mapping);
   * const count = contestantService.updateFromCSV(csvData);
   * console.log(`Imported ${count} contestants`);
   */
  updateFromCSV(csvData: CSVRow[]): number {
    if (!csvData || !Array.isArray(csvData)) return 0;

    const newContestants: Contestant[] = csvData
      .filter(row => row.name && row.ticket) // Only include rows with both name and ticket
      .map((row, index) => ({
        id: `contestant_${index}`,
        name: row.name || '',
        ticket: row.ticket || '',
        email: row.email,
        data: { ...row }
      }));

    this.contestants = newContestants;
    this.saveContestants();

    return newContestants.length;
  }

  /**
   * Finds a contestant by their ticket number
   * @param {string} ticketNumber - The ticket number to search for
   * @returns {Contestant|null} The matching contestant or null if not found
   * @example
   * // Look up a contestant by ticket number
   * const ticketNumber = "12345";
   * const winner = contestantService.findByTicket(ticketNumber);
   * if (winner) {
   *   console.log(`Winner: ${winner.name}`);
   * } else {
   *   console.log("Ticket not found");
   * }
   */
  findByTicket(ticketNumber: string): Contestant | null {
    if (!ticketNumber) return null;

    // Trim and normalize the ticket number for comparison
    const normalizedTicket = ticketNumber.trim();

    // Find the contestant with the matching ticket
    return this.contestants.find(c => c.ticket.trim() === normalizedTicket) || null;
  }

  /**
   * Clears all contestants from memory and storage
   * @example
   * // Clear all contestant data
   * contestantService.clearContestants();
   */
  clearContestants(): void {
    this.contestants = [];
    this.saveContestants();
  }
}

// Export singleton instance
export const contestantService = new ContestantService();
export default contestantService;