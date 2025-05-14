/**
 * @file UnifiedSpinner Component
 * @description A customizable spinner component that can use different spinner types
 * and takes in contestant data with ticket information
 */

import React, { useState, useEffect } from 'react';
import { SpinningWheel, type WheelSegment } from './SpinningWheel';
import { SlotMachine } from './SlotMachine';
import { SimpleWheel } from './SimpleWheel';
import { SimpleSlotMachine } from './SimpleSlotMachine';
import Reel from 'react-reel';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { RandomizerTheme, BUILT_IN_THEMES } from '@/services/randomizer-theme';
import { triggerConfettiByType } from '@/services/confetti';
import { playSound } from '@/services/audio';
import { addWinnerToHistory } from '@/services/history';
import { Contestant } from '@/services/contestants';
import { Card } from '../ui/card';

/**
 * Spinner types supported by the UnifiedSpinner
 */
export type SpinnerType = 'wheel' | 'simple-wheel' | 'slot-machine' | 'simple-slot' | 'reel';

/**
 * Props for the UnifiedSpinner component
 */
export interface UnifiedSpinnerProps {
  /** Array of contestants to use in the spinner */
  contestants: Contestant[];
  
  /** Type of spinner to display */
  spinnerType: SpinnerType;
  
  /** Callback function called when spinning ends with the winning contestant */
  onSpinEnd?: (winner: Contestant) => void;
  
  /** Additional CSS classes to apply to the container */
  className?: string;
  
  /** Size of the spinner (small, medium, or large) */
  size?: 'sm' | 'md' | 'lg';
  
  /** Duration of the spin animation in milliseconds */
  spinDuration?: number;
  
  /** Number of full rotations/iterations before landing on the winner */
  spinIterations?: number;
  
  /** Optional ID of the contestant that should win (for predetermined outcomes) */
  winnerContestantId?: string;
  
  /** Animation profile controlling how the spinner animates */
  animationProfile?: 'gentle' | 'normal' | 'wild';
  
  /** Enable sound effects during spinning */
  enableSoundEffects?: boolean;
  
  /** Enable confetti effect when winner is selected */
  enableConfetti?: boolean;
  
  /** Type of confetti animation to show */
  confettiType?: 'default' | 'explosion' | 'cannon' | 'fireworks' | 'rain';
  
  /** Theme for the spinner (either a theme name or a custom theme object) */
  theme?: string | RandomizerTheme;
  
  /** Background color for the spinner container (overrides theme) */
  backgroundColor?: string;
  
  /** Text color for spinner elements (overrides theme) */
  textColor?: string;
  
  /** Border color for the spinner (overrides theme) */
  borderColor?: string;
  
  /** Custom color palette for spinner elements (overrides theme) */
  customPalette?: string[];
  
  /** Display full ticket number in spinner */
  showTicketNumbers?: boolean;
  
  /** Display email in spinner (if available) */
  showEmail?: boolean;
}

/**
 * A unified spinner component that supports multiple spinner types and
 * integrates with contestant data.
 */
export function UnifiedSpinner({
  contestants,
  spinnerType = 'wheel',
  onSpinEnd,
  className,
  size = 'md',
  spinDuration = 5000,
  spinIterations = 5,
  winnerContestantId,
  animationProfile = 'normal',
  enableSoundEffects = false,
  enableConfetti = true,
  confettiType = 'fireworks',
  theme = 'default',
  backgroundColor,
  textColor,
  borderColor,
  customPalette,
  showTicketNumbers = false,
  showEmail = false
}: UnifiedSpinnerProps) {
  // Component state
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Contestant | null>(null);
  const [reelText, setReelText] = useState<string[]>([]);

  // Get the appropriate theme
  const currentTheme = typeof theme === 'string'
    ? BUILT_IN_THEMES[theme] || BUILT_IN_THEMES.default
    : theme;

  // Theme colors with override support
  const themeColors = customPalette || currentTheme.palette;

  /**
   * Convert contestants to wheel segments
   */
  const contestantsToWheelSegments = (): WheelSegment[] => {
    return contestants.map((contestant, index) => ({
      id: contestant.id,
      label: formatContestantLabel(contestant),
      color: themeColors[index % themeColors.length]
    }));
  };

  /**
   * Format contestant label based on settings
   */
  const formatContestantLabel = (contestant: Contestant): string => {
    let label = contestant.name;
    
    if (showTicketNumbers) {
      label += ` (${contestant.ticket})`;
    }
    
    if (showEmail && contestant.email) {
      label += ` - ${contestant.email}`;
    }
    
    return label;
  };

  /**
   * Handle spin end for wheel-type spinners
   */
  const handleWheelSpinEnd = (wheelSegment: WheelSegment) => {
    const winnerContestant = contestants.find(c => c.id === wheelSegment.id) || null;
    setWinner(winnerContestant);
    
    if (winnerContestant) {
      // Add winner to history
      addWinnerToHistory({
        id: winnerContestant.id,
        name: winnerContestant.name,
        ticket: winnerContestant.ticket,
        email: winnerContestant.email,
        timestamp: new Date().toISOString(),
        method: `${spinnerType} spinner`
      });
      
      // Call callback if provided
      if (onSpinEnd) {
        onSpinEnd(winnerContestant);
      }
    }
  };

  /**
   * Handle spin end for slot-type spinners
   */
  const handleSlotSpinEnd = (selections: string[]) => {
    // For slot machines, we consider the last column's selection as the winner
    const winnerLabel = selections[selections.length - 1];
    const winnerContestant = contestants.find(c => formatContestantLabel(c) === winnerLabel) || null;
    
    setWinner(winnerContestant);
    
    if (winnerContestant) {
      // Add winner to history
      addWinnerToHistory({
        id: winnerContestant.id,
        name: winnerContestant.name,
        ticket: winnerContestant.ticket,
        email: winnerContestant.email,
        timestamp: new Date().toISOString(),
        method: `${spinnerType} spinner`
      });
      
      // Call callback if provided
      if (onSpinEnd) {
        onSpinEnd(winnerContestant);
      }
    }
  };

  /**
   * Handle spin for reel type spinner
   */
  const spinReel = () => {
    if (isSpinning || contestants.length < 1) return;
    
    setIsSpinning(true);
    setWinner(null);
    
    // Play start sound effect if enabled
    if (enableSoundEffects) {
      playSound('slot-start');
    }
    
    // Determine the winning contestant
    let winningContestantIndex = Math.floor(Math.random() * contestants.length);
    
    // Use predetermined winner if specified
    if (winnerContestantId) {
      const foundIndex = contestants.findIndex(contestant => contestant.id === winnerContestantId);
      if (foundIndex !== -1) {
        winningContestantIndex = foundIndex;
      }
    }
    
    const winnerContestant = contestants[winningContestantIndex];
    
    // Update reel text after a brief delay
    setTimeout(() => {
      setReelText([formatContestantLabel(winnerContestant)]);
      
      // Set winner and finish spinning after animation completes
      setTimeout(() => {
        setWinner(winnerContestant);
        setIsSpinning(false);
        
        // Play end sound effect if enabled
        if (enableSoundEffects) {
          playSound('slot-end');
        }
        
        // Trigger confetti celebration if enabled
        if (enableConfetti) {
          triggerConfettiByType(confettiType);
        }
        
        // Add winner to history
        addWinnerToHistory({
          id: winnerContestant.id,
          name: winnerContestant.name,
          ticket: winnerContestant.ticket,
          email: winnerContestant.email,
          timestamp: new Date().toISOString(),
          method: 'reel spinner'
        });
        
        // Call callback if provided
        if (onSpinEnd) {
          onSpinEnd(winnerContestant);
        }
      }, 500); // Short delay after reel stops
    }, spinDuration * 0.8); // Start stopping near the end of spin duration
  };

  /**
   * Start spinning animation
   */
  const spin = () => {
    if (isSpinning || contestants.length < 2) return;
    
    setIsSpinning(true);
    setWinner(null);
    
    // For reel type, handle separately
    if (spinnerType === 'reel') {
      spinReel();
      return;
    }
  };

  // Reel component options
  const reelOptions = {
    reel: {
      frameTime: 30,
      delay: 1
    },
    text: {
      ease: 'elasticOut'
    },
    duration: spinDuration
  };

  // Initialize reel text
  useEffect(() => {
    if (spinnerType === 'reel' && contestants.length > 0) {
      setReelText(['Spin to start!']);
    }
  }, [spinnerType, contestants]);

  // Render the appropriate spinner based on spinnerType
  const renderSpinner = () => {
    if (contestants.length === 0) {
      return (
        <div className="text-center p-8 bg-muted rounded-lg">
          <p className="text-muted-foreground">No contestants available. Import contestants to begin.</p>
        </div>
      );
    }

    switch (spinnerType) {
      case 'wheel':
        return (
          <SpinningWheel
            segments={contestantsToWheelSegments()}
            onSpinEnd={handleWheelSpinEnd}
            size={size}
            spinDuration={spinDuration}
            spinRevolutions={spinIterations}
            winnerSegmentId={winnerContestantId}
            spinProfile={animationProfile}
            enableSoundEffects={enableSoundEffects}
            enableConfetti={enableConfetti}
            confettiType={confettiType}
            theme={theme}
            textColor={textColor}
            backgroundColor={backgroundColor}
            borderColor={borderColor}
            customPalette={customPalette}
          />
        );
        
      case 'simple-wheel':
        return (
          <SimpleWheel
            items={contestants.map(c => formatContestantLabel(c))}
            onSpinEnd={(winner) => {
              const winnerContestant = contestants.find(
                c => formatContestantLabel(c) === winner
              ) || null;
              setWinner(winnerContestant);
              
              if (winnerContestant && onSpinEnd) {
                onSpinEnd(winnerContestant);
              }
            }}
            duration={spinDuration}
            size={size === 'sm' ? 'small' : size === 'md' ? 'medium' : 'large'}
          />
        );
        
      case 'slot-machine':
        return (
          <SlotMachine
            columns={[contestants.map(c => formatContestantLabel(c))]}
            onSpinEnd={handleSlotSpinEnd}
            spinDuration={spinDuration}
            spinIterations={spinIterations}
            enableSoundEffects={enableSoundEffects}
            enableConfetti={enableConfetti}
            theme={theme}
            textColor={textColor}
            backgroundColor={backgroundColor}
            borderColor={borderColor}
          />
        );
        
      case 'simple-slot':
        return (
          <SimpleSlotMachine
            items={contestants.map(c => formatContestantLabel(c))}
            onSpinEnd={(winner) => {
              const winnerContestant = contestants.find(
                c => formatContestantLabel(c) === winner
              ) || null;
              setWinner(winnerContestant);
              
              if (winnerContestant && onSpinEnd) {
                onSpinEnd(winnerContestant);
              }
            }}
            duration={spinDuration}
          />
        );
        
      case 'reel':
        return (
          <div className="flex flex-col items-center">
            <Card className={cn("p-8 mb-4", {
              "w-64": size === 'sm',
              "w-80": size === 'md',
              "w-96": size === 'lg'
            })}>
              <div className="text-center">
                <Reel
                  text={reelText[0] || ""}
                  reel={reelOptions.reel}
                  text={reelOptions.text}
                  style={{
                    fontSize: size === 'sm' ? '1.5rem' : size === 'md' ? '2rem' : '2.5rem',
                    height: size === 'sm' ? '3rem' : size === 'md' ? '4rem' : '5rem',
                    fontWeight: 'bold',
                    color: textColor || currentTheme.text
                  }}
                />
              </div>
            </Card>
            <Button
              variant="default"
              size="lg"
              onClick={spinReel}
              disabled={isSpinning || contestants.length < 1}
              className="px-8 font-semibold"
              style={{
                backgroundColor: currentTheme.accent,
                borderColor: currentTheme.accent
              }}
            >
              {isSpinning ? 'Spinning...' : 'SPIN!'}
            </Button>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className={cn('flex flex-col items-center space-y-6', className)}>
      {renderSpinner()}
      
      {/* Winner display for non-wheel/slot spinners (they handle their own display) */}
      {winner && ['simple-wheel', 'simple-slot', 'reel'].includes(spinnerType) && (
        <div className="text-center animate-fade-in">
          <p className="text-muted-foreground">Winner:</p>
          <p
            className="text-xl font-bold text-shadow-lg animate-glow"
            style={{
              color: currentTheme.highlight || 'var(--foreground)',
              textShadow: `0 0 10px ${currentTheme.highlight}80, 0 0 20px ${currentTheme.highlight}40`
            }}>
            {winner.name}
            {showTicketNumbers && ` (${winner.ticket})`}
            {showEmail && winner.email && ` - ${winner.email}`}
          </p>
        </div>
      )}
    </div>
  );
}

export default UnifiedSpinner;