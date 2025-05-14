import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { playSound, preloadSounds } from '@/services/audio';
import { addWinnerToHistory, slotItemsToRecord } from '@/services/history';
import { triggerConfettiByType } from '@/services/confetti';
import { createWinnerConfetti } from '@/services/custom-confetti';
import { RandomizerTheme, BUILT_IN_THEMES } from '@/services/randomizer-theme';

export interface SlotItem {
  id: string;
  label: string;
  value?: string;
  color?: string;
}

export type SlotSpinProfile = 'normal' | 'fast' | 'progressive';

export interface SlotMachineProps {
  /** Array of items to display in the slot machine */
  items: SlotItem[];

  /** Number of columns/reels in the slot machine */
  columns?: number;

  /** Callback function when spinning completes, with result items */
  onSpinEnd?: (result: SlotItem[]) => void;

  /** Additional CSS classes to apply to the container */
  className?: string;

  /** Duration of the spin animation in milliseconds */
  spinDuration?: number;

  /** Number of iterations each reel should spin before stopping */
  spinIterations?: number;

  /** Animation profile for spinning behavior */
  spinProfile?: SlotSpinProfile;

  /** Enable sound effects during spinning */
  enableSoundEffects?: boolean;

  /** Progressive column stop delay (in ms) when using progressive profile */
  progressiveDelay?: number;

  /** Enable confetti effect when winner is selected */
  enableConfetti?: boolean;

  /** Type of confetti animation to show */
  confettiType?: 'default' | 'explosion' | 'cannon' | 'fireworks' | 'rain';

  /** Theme for the slot machine (either a theme name or a custom theme object) */
  theme?: string | RandomizerTheme;

  /** Text color for slot items (overrides theme) */
  textColor?: string;

  /** Background color for the slot machine container (overrides theme) */
  backgroundColor?: string;

  /** Border color for the slot machine (overrides theme) */
  borderColor?: string;

  /** Background color for the reel windows (overrides theme) */
  reelColor?: string;

  /** Custom color palette for slot items (overrides theme) */
  customPalette?: string[];
}

export function SlotMachine({
  items,
  columns = 3,
  onSpinEnd,
  className,
  spinDuration = 3000,
  spinIterations = 20,
  spinProfile = 'normal',
  enableSoundEffects = false,
  progressiveDelay = 300,
  enableConfetti = true,
  confettiType = 'cannon',
  theme = 'default',
  textColor,
  backgroundColor,
  borderColor,
  reelColor,
  customPalette
}: SlotMachineProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [results, setResults] = useState<SlotItem[]>([]);
  const [reels, setReels] = useState<SlotItem[][]>([]);
  const [offsets, setOffsets] = useState<number[]>([]);
  const [currentProfile, setCurrentProfile] = useState(spinProfile);
  const [playSound, setPlaySound] = useState(enableSoundEffects);
  const [activeColumns, setActiveColumns] = useState<boolean[]>([]);
  const reelsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Get the appropriate theme
  const currentTheme = typeof theme === 'string'
    ? BUILT_IN_THEMES[theme] || BUILT_IN_THEMES.default
    : theme;

  // Pre-generate default colors if none provided
  const itemsWithColors = items.map((item, index) => {
    if (item.color) return item;

    // Use theme colors or custom palette
    const themeColors = customPalette || currentTheme.palette;

    return {
      ...item,
      color: themeColors[index % themeColors.length]
    };
  });
  
  // Animation profiles with different cubic-bezier curves for varying spin effects
  const spinProfileCurves = useMemo(() => ({
    normal: 'cubic-bezier(0.21, 0.53, 0.29, 0.99)',    // Default balanced curve
    fast: 'cubic-bezier(0.15, 0.75, 0.3, 0.96)',       // Faster with quicker slowdown
    progressive: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' // More linear, for progressive stopping
  }), []);

  // Preload slot machine sound effects
  useEffect(() => {
    preloadSounds(['slot-start', 'slot-tick', 'slot-end'] as any);
  }, []);

  // Play a sound effect if sound effects are enabled
  const playSoundEffect = useCallback((type: 'start' | 'tick' | 'end') => {
    if (!playSound) return;
    // Use the audio service to play the sound
    playSound(`slot-${type}` as any);
  }, [playSound]);

  // Initialize reels with memoization for better performance
  useEffect(() => {
    if (items.length < 1) return;

    // Create columns (reels) with randomized items
    const newReels: SlotItem[][] = [];
    const newOffsets: number[] = [];
    const newActiveColumns = Array(columns).fill(false);

    for (let i = 0; i < columns; i++) {
      // Create a reel with randomized items
      const shuffled = [...itemsWithColors]
        .sort(() => Math.random() - 0.5)
        // Repeat items to ensure enough for smooth animation
        .concat([...itemsWithColors].sort(() => Math.random() - 0.5))
        .concat([...itemsWithColors].sort(() => Math.random() - 0.5));

      newReels.push(shuffled);
      newOffsets.push(0);
    }

    setReels(newReels);
    setOffsets(newOffsets);
    setActiveColumns(newActiveColumns);
  }, [items, columns, itemsWithColors]);
  
  const spin = useCallback(() => {
    if (isSpinning || items.length < 1) return;

    setIsSpinning(true);
    setResults([]);
    setActiveColumns(Array(columns).fill(true));

    // Play start sound effect
    playSoundEffect('start');

    const finalResults: SlotItem[] = [];
    const newOffsets: number[] = [];

    // For each reel, determine where it will stop
    for (let i = 0; i < columns; i++) {
      const reel = reels[i];
      // Random index where this reel will stop
      const randomIndex = Math.floor(Math.random() * items.length);
      finalResults.push(itemsWithColors[randomIndex]);

      // Calculate new offset to display the result
      // Add spinIterations full rotations to create spinning effect
      const itemHeight = reelsRef.current[i]?.children[0]?.clientHeight || 80;

      // Adjust iteration count based on profile
      let effectiveIterations = spinIterations;
      if (currentProfile === 'fast') {
        effectiveIterations = Math.max(10, Math.floor(spinIterations * 0.75));
      }

      const newOffset = (effectiveIterations * items.length * itemHeight) + (randomIndex * itemHeight);
      newOffsets.push(newOffset);
    }

    // Set up ticking sound during spin
    if (playSound) {
      const tickInterval = setInterval(() => {
        playSoundEffect('tick');
      }, 100);

      // Clear interval when animation ends
      setTimeout(() => {
        clearInterval(tickInterval);
      }, spinDuration - 500);
    }

    // Progressive profile: handle columns stopping at different times
    if (currentProfile === 'progressive') {
      // Update first column immediately
      const progressiveOffsets = [...offsets];
      progressiveOffsets[0] = newOffsets[0];
      setOffsets(progressiveOffsets);

      // Stagger the rest of the columns
      for (let i = 1; i < columns; i++) {
        setTimeout(() => {
          setOffsets(prev => {
            const updated = [...prev];
            updated[i] = newOffsets[i];
            return updated;
          });

          setActiveColumns(prev => {
            const updated = [...prev];
            updated[i-1] = false;
            return updated;
          });

          // Play end sound for each column except the last one
          if (i < columns - 1) {
            playSoundEffect('tick');
          }
        }, i * progressiveDelay);
      }

      // Final completion handler for progressive mode
      setTimeout(() => {
        setActiveColumns(Array(columns).fill(false));
        setResults(finalResults);
        setIsSpinning(false);
        playSoundEffect('end');

        // Add winner to history
        addWinnerToHistory(slotItemsToRecord(finalResults, `Slot machine with ${currentProfile} profile (progressive)`));

        // Trigger confetti
        if (enableConfetti) {
          triggerConfettiByType(confettiType);
        }

        if (onSpinEnd) onSpinEnd(finalResults);
      }, spinDuration + (columns - 1) * progressiveDelay);
    } else {
      // Standard mode: all columns stop at the same time
      setOffsets(newOffsets);

      // Set the results after animation completes
      setTimeout(() => {
        setActiveColumns(Array(columns).fill(false));
        setResults(finalResults);
        setIsSpinning(false);
        playSoundEffect('end');

        // Add winner to history
        addWinnerToHistory(slotItemsToRecord(finalResults, `Slot machine with ${currentProfile} profile`));

        // Trigger confetti
        if (enableConfetti) {
          triggerConfettiByType(confettiType);
        }

        if (onSpinEnd) onSpinEnd(finalResults);
      }, spinDuration);
    }
  }, [isSpinning, items.length, columns, spinIterations, currentProfile, reels, itemsWithColors,
      reelsRef, progressiveDelay, offsets, spinDuration, onSpinEnd, playSoundEffect, playSound]);
  
  return (
    <div className={cn('flex flex-col items-center gap-6', className)}>
      <div
        className="flex gap-2 p-4 rounded-lg shadow-lg"
        style={{
          backgroundColor: backgroundColor || currentTheme.background,
          borderWidth: '4px',
          borderStyle: 'solid',
          borderColor: borderColor || currentTheme.border
        }}
      >
        {/* Slot machine reels */}
        {reels.map((reel, reelIndex) => (
          <div
            key={reelIndex}
            className="relative overflow-hidden w-24 h-80 rounded-md"
            style={{
              backgroundColor: reelColor || 'var(--muted)'
            }}
          >
            {/* Reel display window highlight */}
            <div
              className="absolute top-1/2 left-0 right-0 h-16 -mt-8 z-10"
              style={{
                backgroundColor: `${currentTheme.accent}20`,
                borderTopWidth: '2px',
                borderBottomWidth: '2px',
                borderStyle: 'solid',
                borderColor: currentTheme.accent
              }}
            />

            {/* Reel items */}
            <div
              ref={el => reelsRef.current[reelIndex] = el}
              className="absolute top-0 left-0 w-full transition-transform"
              style={{
                transform: `translateY(-${offsets[reelIndex]}px)`,
                transition: activeColumns[reelIndex] || isSpinning ?
                  `transform ${spinDuration}ms ${spinProfileCurves[currentProfile]}` : 'none'
              }}
            >
              {/* Additional buffer items at the beginning to enable smoother animation */}
              {reel.map((item, itemIndex) => (
                <div
                  key={`${item.id}-${itemIndex}`}
                  className="h-16 flex items-center justify-center p-2 font-bold"
                  style={{
                    color: textColor || currentTheme.text,
                    backgroundColor: itemIndex % 2 === 0 ? `${item.color}30` : 'transparent'
                  }}
                >
                  <span className="truncate text-center">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Glass reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        {/* Animation profile selector */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-muted-foreground">Spin Style:</span>
          <div className="flex gap-1">
            {(['normal', 'fast', 'progressive'] as const).map((profile) => (
              <Button
                key={profile}
                variant={currentProfile === profile ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentProfile(profile)}
                disabled={isSpinning}
                className="text-xs capitalize"
                style={{
                  backgroundColor: currentProfile === profile ? currentTheme.accent : undefined,
                  borderColor: currentTheme.accent
                }}
              >
                {profile}
              </Button>
            ))}
          </div>
        </div>

        {/* Sound toggle */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-muted-foreground">Sound:</span>
          <Button
            variant={playSound ? "default" : "outline"}
            size="sm"
            onClick={() => setPlaySound(prev => !prev)}
            disabled={isSpinning}
            className="text-xs"
            style={{
              backgroundColor: playSound ? currentTheme.accent : undefined,
              borderColor: currentTheme.accent
            }}
          >
            {playSound ? "ON" : "OFF"}
          </Button>
        </div>

        <Button
          variant="default"
          size="lg"
          onClick={spin}
          disabled={isSpinning || items.length < 1}
          className="px-8 font-semibold"
          style={{
            backgroundColor: currentTheme.accent,
            borderColor: currentTheme.accent
          }}
        >
          {isSpinning ? 'Spinning...' : 'SPIN!'}
        </Button>

        {results.length > 0 && (
          <div className="text-center animate-fade-in mt-4">
            <p className="text-muted-foreground">Result:</p>
            <div className="flex gap-2 justify-center">
              {results.map((result, index) => {
                // Check if all results are the same (jackpot)
                const isJackpot = results.every(item => item.id === results[0].id) && results.length > 1;

                return (
                  <span
                    key={index}
                    className={cn(
                      "text-xl font-bold px-2 py-1 rounded text-shadow-md",
                      isJackpot ? "animate-jackpot" : "",
                      index % 2 === 0 ? "mask-gradient-fade" : "mask-radial"
                    )}
                    style={{
                      color: currentTheme.highlight,
                      backgroundColor: `${result.color || currentTheme.accent}${isJackpot ? '60' : '20'}`,
                      textShadow: `0 0 8px ${currentTheme.highlight}60`,
                      ['--highlight-glow' as any]: result.color || currentTheme.highlight
                    }}
                  >
                    {result.label}
                  </span>
                );
              })}
            </div>
            {results.every(item => item.id === results[0].id) && results.length > 1 && (
              <p
                className="text-xl font-bold text-shadow-lg animate-glow mt-2"
                ref={(el) => {
                  // Extra confetti for jackpot with more colorful celebration
                  if (el && enableConfetti) {
                    createWinnerConfetti(el, {
                      count: 150, // More confetti for jackpot
                      duration: 7000, // Longer animation
                      colors: [
                        results[0].color || currentTheme.highlight,
                        currentTheme.accent,
                        currentTheme.primary,
                        '#FFD700', // Gold color for jackpot
                        '#FFA500' // Orange for jackpot
                      ]
                    });
                  }
                }}
                style={{
                  color: currentTheme.highlight,
                  textShadow: `0 0 10px ${currentTheme.highlight}80, 0 0 20px ${currentTheme.highlight}40`,
                  ['--highlight-glow' as any]: currentTheme.highlight
                }}>
                JACKPOT!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}