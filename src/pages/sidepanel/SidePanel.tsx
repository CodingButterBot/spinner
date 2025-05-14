/**
 * @file SidePanel Page Component
 * @description Ultra-simplified side panel with just raffle dropdown and spinner
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpinningWheel, WheelSegment } from '@/components/randomizers/SpinningWheel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { contestantService } from '@/services/contestants';
import { Button } from '@/components/ui/button';
import { addWinnerToHistory, wheelSegmentToRecord } from '@/services/history';

/**
 * Minimal SidePanel component with just a dropdown and spinner wheel
 * @component SidePanel
 */
export default function SidePanel() {
  // State for raffle data
  const [raffles, setRaffles] = useState<string[]>([]);
  const [selectedRaffle, setSelectedRaffle] = useState<string>('');

  // State for wheel
  const [segments, setSegments] = useState<WheelSegment[]>([]);
  const [winner, setWinner] = useState<WheelSegment | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Load raffles and contestants on component mount
  useEffect(() => {
    const contestants = contestantService.getAllContestants();

    // Convert contestants to wheel segments
    if (contestants.length > 0) {
      const contestantSegments = contestants.map(contestant => ({
        id: contestant.ticket,
        label: contestant.name
      }));
      setSegments(contestantSegments);
      setRaffles(['Current Raffle']);
      setSelectedRaffle('Current Raffle');
    } else {
      // If no contestants, add demo segments
      setSegments([
        { id: '1', label: 'Demo 1' },
        { id: '2', label: 'Demo 2' },
        { id: '3', label: 'Demo 3' },
        { id: '4', label: 'Demo 4' }
      ]);
      setRaffles(['Demo Raffle']);
      setSelectedRaffle('Demo Raffle');
    }
  }, []);

  /**
   * Handle raffle selection change
   * @param {string} value - Selected raffle name
   */
  const handleRaffleChange = (value: string) => {
    setSelectedRaffle(value);
    setWinner(null);
  };

  /**
   * Handle wheel spin completion
   * @param {WheelSegment} winningSegment - The winning wheel segment
   */
  const handleSpinEnd = (winningSegment: WheelSegment) => {
    setWinner(winningSegment);
    setIsSpinning(false);

    // Save result to history
    addWinnerToHistory(wheelSegmentToRecord(winningSegment));
  };

  /**
   * Start wheel spin
   */
  const handleSpin = () => {
    setWinner(null);
    setIsSpinning(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header with raffle selector */}
      <div className="p-4 border-b sticky top-0 bg-background z-10">
        <Card>
          <CardHeader>
            <CardTitle>SpinPick Raffle</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedRaffle}
              onValueChange={handleRaffleChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a raffle" />
              </SelectTrigger>
              <SelectContent>
                {raffles.map((raffle) => (
                  <SelectItem key={raffle} value={raffle}>
                    {raffle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Main spinner */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center">
        {selectedRaffle ? (
          <>
            <div className="mb-4">
              <Button
                onClick={handleSpin}
                disabled={isSpinning || segments.length === 0}
                size="lg"
                className="px-8"
              >
                Spin Wheel
              </Button>
            </div>

            <div className="relative mb-6">
              <SpinningWheel
                segments={segments}
                onSpinEnd={handleSpinEnd}
                size="md"
                autoSpin={isSpinning}
              />
            </div>

            {winner && (
              <Card className="w-full max-w-md mt-4">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-medium text-muted-foreground mb-1">Winner:</h3>
                  <p className="text-2xl font-bold">{winner.label}</p>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                <p>Please select a raffle to continue</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t text-center text-xs text-muted-foreground">
        <p>Configure raffles in options page</p>
      </div>
    </div>
  );
}