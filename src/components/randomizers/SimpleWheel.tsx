/**
 * @file SimpleWheel Component
 * @description A complete wheel randomizer with contestant entry, ticket validation, and result display
 */

import React, { useState, useEffect } from 'react';
import { SpinningWheel, WheelSegment } from './SpinningWheel';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckIcon } from 'lucide-react';
import { contestantService, Contestant } from '@/services/contestants';
import { WinnerHistory } from '../history/WinnerHistory';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getThemeOptions, RandomizerTheme, BUILT_IN_THEMES } from '@/services/randomizer-theme';

/**
 * Props for the SimpleWheel component
 * @interface SimpleWheelProps
 */
export interface SimpleWheelProps {
  /** Callback function called when spinning ends with the winning label */
  onSaveResult?: (result: string) => void;

  /** Whether to show the ticket number input for selecting specific winners */
  showTicketInput?: boolean;

  /** Initial theme for the wheel */
  initialTheme?: string;
}

/**
 * A complete spinning wheel interface with contestant management and winner selection
 *
 * @component SimpleWheel
 * @example
 * // Basic usage
 * <SimpleWheel
 *   onSaveResult={(winnerName) => console.log(`The winner is: ${winnerName}`)}
 * />
 *
 * // Without ticket input box (random selection only)
 * <SimpleWheel showTicketInput={false} />
 */
export function SimpleWheel({
  onSaveResult,
  showTicketInput = true,
  initialTheme = 'default'
}: SimpleWheelProps) {
  // State for wheel segments and options
  const [segments, setSegments] = useState<WheelSegment[]>([
    { id: '1', label: 'Option 1' },
    { id: '2', label: 'Option 2' },
    { id: '3', label: 'Option 3' },
    { id: '4', label: 'Option 4' }
  ]);

  // State for user input
  const [newItemText, setNewItemText] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [ticketError, setTicketError] = useState('');

  // State for winner selection and display
  const [winnerSegmentId, setWinnerSegmentId] = useState<string | undefined>();
  const [winner, setWinner] = useState<WheelSegment | null>(null);
  const [winnerDetails, setWinnerDetails] = useState<Contestant | null>(null);

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<string>(initialTheme);
  const [themeOptions, setThemeOptions] = useState<Array<{ value: string, label: string }>>([]);

  // Load theme options
  useEffect(() => {
    const options = getThemeOptions();
    setThemeOptions(options);
  }, []);

  /**
   * Load contestants from service on component mount
   */
  useEffect(() => {
    const contestants = contestantService.getAllContestants();
    if (contestants.length > 0) {
      const contestantSegments = contestants.map(contestant => ({
        id: contestant.ticket,
        label: contestant.name
      }));
      setSegments(contestantSegments);
    }
  }, []);

  /**
   * Add a new custom segment to the wheel
   */
  const handleAddItem = () => {
    if (!newItemText.trim()) return;

    setSegments([
      ...segments,
      {
        id: Date.now().toString(),
        label: newItemText.trim()
      }
    ]);
    setNewItemText('');
  };

  /**
   * Remove a segment from the wheel
   * @param {string} id - ID of the segment to remove
   */
  const handleRemoveItem = (id: string) => {
    setSegments(segments.filter(item => item.id !== id));
  };

  /**
   * Handle wheel spin completion and winner determination
   * @param {WheelSegment} winner - The winning wheel segment
   */
  const handleSpinEnd = (winner: WheelSegment) => {
    setWinner(winner);

    if (onSaveResult) {
      onSaveResult(winner.label);
    }
  };

  /**
   * Start spinning the wheel, optionally with a predetermined winner
   * from the ticket input
   */
  const handleSpin = () => {
    setWinnerSegmentId(undefined);
    setWinnerDetails(null);

    // If ticket number provided, try to find matching contestant
    if (ticketNumber && showTicketInput) {
      const contestant = contestantService.findByTicket(ticketNumber);

      if (!contestant) {
        setTicketError('Ticket number not found');
        return;
      }

      setTicketError('');
      setWinnerDetails(contestant);

      // Find matching segment, or pick random if no match
      const winnerSegment = segments.find(s => s.id === contestant.ticket || s.label === contestant.name);

      if (winnerSegment) {
        setWinnerSegmentId(winnerSegment.id);
      } else {
        const randomIndex = Math.floor(Math.random() * segments.length);
        setWinnerSegmentId(segments[randomIndex].id);
      }
    }
  };

  return (
    <div className="p-4 flex flex-col items-center">
      {/* Ticket input section */}
      {showTicketInput && (
        <Card className="w-full max-w-md mb-4">
          <CardHeader>
            <CardTitle>Winner Selection</CardTitle>
            <CardDescription>Enter the winning ticket number</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Ticket input and spin button */}
            <div className="flex gap-2">
              <Input
                value={ticketNumber}
                onChange={(e) => {
                  setTicketNumber(e.target.value);
                  setTicketError('');
                }}
                placeholder="Enter ticket number"
                className="flex-1"
              />
              <Button onClick={handleSpin}>Spin to Winner</Button>
            </div>

            {/* Error message */}
            {ticketError && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{ticketError}</AlertDescription>
              </Alert>
            )}

            {/* Winner details */}
            {winnerDetails && (
              <Alert className="mt-2 bg-green-50 dark:bg-green-900/20 border-green-500">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <strong>{winnerDetails.name}</strong> (Ticket: {winnerDetails.ticket})
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Wheel options section */}
      <Card className="w-full max-w-md mb-4">
        <CardHeader>
          <CardTitle>Wheel Options</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add new segment input */}
          <div className="flex gap-2 mb-4">
            <Input
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Add new option"
              className="flex-1"
            />
            <Button onClick={handleAddItem}>Add</Button>
          </div>

          {/* Segment list */}
          <div className="max-h-60 overflow-y-auto">
            {segments.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No options added yet. Import contestants or add options manually.
              </div>
            ) : (
              segments.map(segment => (
                <div key={segment.id} className="flex justify-between items-center p-2 border-b">
                  <span>{segment.label}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(segment.id)}
                    className="text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Theme selection */}
      <Card className="w-full max-w-md mb-4">
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
          <CardDescription>Customize the appearance of your wheel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select
                value={currentTheme}
                onValueChange={setCurrentTheme}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wheel component */}
      <SpinningWheel
        segments={segments}
        onSpinEnd={handleSpinEnd}
        size="md"
        winnerSegmentId={winnerSegmentId}
        theme={currentTheme}
      />

      {/* Winner display for non-ticket results */}
      {winner && !winnerDetails && (
        <div className="mt-4 p-4 bg-card border rounded-md text-center">
          <p className="text-muted-foreground">Winner:</p>
          <p className="text-2xl font-bold">{winner.label}</p>
        </div>
      )}

      {/* Winner history */}
      <Card className="w-full max-w-md mt-4">
        <CardHeader>
          <CardTitle>Winner History</CardTitle>
        </CardHeader>
        <CardContent>
          <WinnerHistory maxRecentWinners={5} />
        </CardContent>
      </Card>
    </div>
  );
}