/**
 * History Service for the spinner application
 * Handles tracking, storing, and retrieving winner history
 */

import { WheelSegment } from '@/components/randomizers/SpinningWheel';
import { SlotItem } from '@/components/randomizers/SlotMachine';

// Key for localStorage
const HISTORY_STORAGE_KEY = 'spinner_winner_history';

// Types of randomizers
export type RandomizerType = 'wheel' | 'slot';

// Common interface for both randomizer result types
export interface WinnerRecord {
  id: string;           // Unique ID for the record
  timestamp: number;    // When the win occurred (in milliseconds since epoch)
  randomizerType: RandomizerType;  // Which randomizer was used
  label: string;        // Display name of the winner
  value?: string;       // Optional additional value
  detail?: string;      // Additional information about the drawing
}

/**
 * Converts a wheel segment to a winner record
 */
export const wheelSegmentToRecord = (segment: WheelSegment, detail?: string): WinnerRecord => ({
  id: `wheel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  timestamp: Date.now(),
  randomizerType: 'wheel',
  label: segment.label,
  value: segment.id,
  detail
});

/**
 * Converts slot machine results to a winner record
 */
export const slotItemsToRecord = (items: SlotItem[], detail?: string): WinnerRecord => {
  // Combine all slot items into a single label with separator
  const label = items.map(item => item.label).join(' | ');
  const value = items.map(item => item.id).join(',');
  
  return {
    id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    randomizerType: 'slot',
    label,
    value,
    detail
  };
};

/**
 * Adds a winner record to history
 */
export const addWinnerToHistory = (winner: WinnerRecord): void => {
  const history = getWinnerHistory();
  history.unshift(winner); // Add to beginning of array
  saveWinnerHistory(history);

  // Dispatch event to notify other components of history change
  window.dispatchEvent(new Event('winnerHistoryChanged'));
};

/**
 * Gets all winner history
 */
export const getWinnerHistory = (): WinnerRecord[] => {
  try {
    const historyJson = localStorage.getItem(HISTORY_STORAGE_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Error retrieving winner history:', error);
    return [];
  }
};

/**
 * Saves winner history to localStorage
 */
export const saveWinnerHistory = (history: WinnerRecord[]): void => {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving winner history:', error);
  }
};

/**
 * Clears all winner history
 */
export const clearWinnerHistory = (): void => {
  localStorage.removeItem(HISTORY_STORAGE_KEY);

  // Dispatch event to notify other components of history change
  window.dispatchEvent(new Event('winnerHistoryChanged'));
};

/**
 * Gets filtered winner history by type
 */
export const getHistoryByType = (type: RandomizerType): WinnerRecord[] => {
  const history = getWinnerHistory();
  return history.filter(record => record.randomizerType === type);
};

/**
 * Removes a specific winner record by ID
 */
export const removeWinnerRecord = (id: string): void => {
  const history = getWinnerHistory();
  const filteredHistory = history.filter(record => record.id !== id);
  saveWinnerHistory(filteredHistory);
};

/**
 * Exports winner history as CSV
 */
export const exportHistoryAsCSV = (): string => {
  const history = getWinnerHistory();
  if (history.length === 0) return '';

  // CSV header
  const headers = ['Timestamp', 'Type', 'Winner', 'Value', 'Details'];
  
  // Format each record as a CSV row
  const rows = history.map(record => [
    new Date(record.timestamp).toLocaleString(),
    record.randomizerType === 'wheel' ? 'Spinning Wheel' : 'Slot Machine',
    record.label,
    record.value || '',
    record.detail || ''
  ]);

  // Combine header and rows and return CSV string
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};

/**
 * Downloads history as CSV file
 */
export const downloadHistoryCSV = (): void => {
  const csv = exportHistoryAsCSV();
  if (!csv) return;
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `spinner_history_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};