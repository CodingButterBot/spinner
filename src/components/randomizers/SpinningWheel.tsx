/**
 * @file SpinningWheel Component
 * @description A customizable spinning wheel randomizer component that can select a random winner
 * or be configured to land on a specific predefined winner
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { playSound, preloadWheelSounds } from '@/services/audio';
import { addWinnerToHistory, wheelSegmentToRecord } from '@/services/history';
import { triggerConfettiByType } from '@/services/confetti';
import { createWinnerConfetti } from '@/services/custom-confetti';
import { RandomizerTheme, BUILT_IN_THEMES } from '@/services/randomizer-theme';

/**
 * Represents a segment on the spinning wheel
 * @interface WheelSegment
 */
export interface WheelSegment {
  /** Unique identifier for the segment, used for targeting a specific winner */
  id: string;

  /** Text displayed on the segment */
  label: string;

  /** Optional CSS color for the segment */
  color?: string;
}

/**
 * Type for spin animation profiles with different easing curves
 * @type SpinProfile
 */
export type SpinProfile = 'gentle' | 'normal' | 'wild';

/**
 * Props for the SpinningWheel component
 * @interface SpinningWheelProps
 */
export interface SpinningWheelProps {
  /** Array of segments to display on the wheel */
  segments: WheelSegment[];

  /** Callback function called when spinning ends with the winning segment */
  onSpinEnd?: (winner: WheelSegment) => void;

  /** Additional CSS classes to apply to the wheel container */
  className?: string;

  /** Size of the wheel (small, medium, or large) */
  size?: 'sm' | 'md' | 'lg';

  /** Duration of the spin animation in milliseconds */
  spinDuration?: number;

  /** Number of full rotations before landing on the winner */
  spinRevolutions?: number;

  /** Optional ID of the segment that should win (for predetermined outcomes) */
  winnerSegmentId?: string;

  /** Animation profile controlling how the wheel spins and slows down */
  spinProfile?: SpinProfile;

  /** Enable sound effects during spinning */
  enableSoundEffects?: boolean;

  /** Enable confetti effect when winner is selected */
  enableConfetti?: boolean;

  /** Type of confetti animation to show ('default', 'explosion', 'cannon', 'fireworks', 'rain') */
  confettiType?: 'default' | 'explosion' | 'cannon' | 'fireworks' | 'rain';

  /** Theme for the wheel (either a theme name or a custom theme object) */
  theme?: string | RandomizerTheme;

  /** Text color for wheel segments (overrides theme) */
  textColor?: string;

  /** Background color for the wheel container (overrides theme) */
  backgroundColor?: string;

  /** Border color for the wheel (overrides theme) */
  borderColor?: string;

  /** Custom color palette for segments (overrides theme) */
  customPalette?: string[];
}

/**
 * A spinning wheel component that randomly selects a winner from provided segments
 *
 * @component SpinningWheel
 * @example
 * // Basic usage
 * <SpinningWheel
 *   segments={[
 *     { id: '1', label: 'Prize 1' },
 *     { id: '2', label: 'Prize 2' },
 *     { id: '3', label: 'Prize 3' }
 *   ]}
 *   onSpinEnd={(winner) => console.log(`The winner is: ${winner.label}`)}
 * />
 *
 * // Predetermined winner
 * <SpinningWheel
 *   segments={segments}
 *   winnerSegmentId="2" // Will always land on segment with id "2"
 * />
 */
export function SpinningWheel({
  segments,
  onSpinEnd,
  className,
  size = 'md',
  spinDuration = 5000,
  spinRevolutions = 5,
  winnerSegmentId,
  spinProfile = 'normal',
  enableSoundEffects = false,
  enableConfetti = true,
  confettiType = 'fireworks',
  theme = 'default',
  textColor,
  backgroundColor,
  borderColor,
  customPalette
}: SpinningWheelProps) {
  // Component state
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [winner, setWinner] = useState<WheelSegment | null>(null);
  const [currentProfile, setCurrentProfile] = useState(spinProfile);
  const [soundEnabled, setSoundEnabled] = useState(enableSoundEffects);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Size class mapping based on the size prop
  const sizeClass = {
    sm: 'w-64 h-64',
    md: 'w-80 h-80',
    lg: 'w-96 h-96'
  }[size];

  // Animation profiles with different cubic-bezier curves for varying spin effects
  const spinProfileCurves = {
    gentle: 'cubic-bezier(0.27, 0.57, 0.21, 0.9)',     // Smoother, gentler stop
    normal: 'cubic-bezier(0.17, 0.67, 0.21, 1)',       // Default balanced curve
    wild: 'cubic-bezier(0.05, 0.85, 0.15, 1.15)'       // More aggressive, bouncy stop
  };

  // Get the appropriate theme
  const currentTheme = typeof theme === 'string'
    ? BUILT_IN_THEMES[theme] || BUILT_IN_THEMES.default
    : theme;

  // Theme colors for segments with override support
  const themeColors = customPalette || currentTheme.palette;

  // Add colors to segments if not provided
  const segmentsWithColors = segments.map((segment, index) =>
    segment.color
      ? segment
      : { ...segment, color: themeColors[index % themeColors.length] }
  );

  // Calculate angle for each segment
  const segmentAngle = 360 / Math.max(segments.length, 1);

  /**
   * Initiates the wheel spinning animation
   * Determines the winning segment and triggers the callback when complete
   */
  /**
   * Plays a sound effect if sound effects are enabled
   * @param type Type of sound effect to play
   */
  const playSoundEffect = (type: 'start' | 'tick' | 'end') => {
    if (!soundEnabled) return;

    // Use the audio service to play the sound
    playSound(`wheel-${type}` as any);
  };

  // Preload sounds when component mounts
  useEffect(() => {
    preloadWheelSounds();
  }, []);

  /**
   * Initiates the wheel spinning animation with enhanced profiles and effects
   * Determines the winning segment and triggers the callback when complete
   */
  const spin = () => {
    // Don't spin if already spinning or insufficient segments
    if (isSpinning || segments.length < 2) return;

    setIsSpinning(true);
    setWinner(null);

    // Play start sound effect
    playSoundEffect('start');

    // Determine the winning segment index
    let winningSegmentIndex = Math.floor(Math.random() * segments.length);

    // Use predetermined winner if specified
    if (winnerSegmentId) {
      const foundIndex = segments.findIndex(segment => segment.id === winnerSegmentId);
      if (foundIndex !== -1) {
        winningSegmentIndex = foundIndex;
      }
    }

    // Add randomness within the segment for natural landing
    const randomOffsetWithinSegment = Math.random() * segmentAngle;

    // Calculate final position
    // The wheel rotates so the winning segment lands at the top (0 degrees)
    // Add 90° because segments start at 3 o'clock position
    const winningPosition = 360 - (winningSegmentIndex * segmentAngle + randomOffsetWithinSegment) + 90;

    // Add extra spins for wild profile, fewer for gentle
    const profileMultiplier = currentProfile === 'wild' ? 1.2 : currentProfile === 'gentle' ? 0.8 : 1;
    const totalRotation = winningPosition + (360 * spinRevolutions * profileMultiplier);

    // Trigger rotation animation
    setRotationDeg(prevRotation => prevRotation + totalRotation);

    // Set up ticking sound during spin
    if (soundEnabled) {
      // Play tick sounds during spinning at intervals
      const tickInterval = setInterval(() => {
        playSoundEffect('tick');
      }, 100);

      // Clear interval when animation ends
      setTimeout(() => {
        clearInterval(tickInterval);
      }, spinDuration - 500);
    }

    // Set winner after animation completes
    setTimeout(() => {
      const selectedSegment = segments[winningSegmentIndex];
      setWinner(selectedSegment);
      setIsSpinning(false);

      // Play end sound effect
      playSoundEffect('end');

      // Add winner to history
      addWinnerToHistory(wheelSegmentToRecord(selectedSegment, `Spin with ${currentProfile} profile`));

      // Trigger confetti celebration
      if (enableConfetti) {
        triggerConfettiByType(confettiType);
      }

      if (onSpinEnd) onSpinEnd(selectedSegment);
    }, spinDuration);
  };

  return (
    <div className={cn('flex flex-col items-center gap-6', className)}>
      <div className="relative">
        {/* Pointer triangle at the top */}
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[20px]"
          style={{
            borderBottomColor: borderColor || currentTheme.highlight
          }}
        />

        {/* Main wheel container */}
        <div
          ref={wheelRef}
          className={cn(
            'relative rounded-full border-4 overflow-hidden',
            sizeClass,
            'transition-transform transform'
          )}
          style={{
            transform: `rotate(${rotationDeg}deg)`,
            transition: isSpinning ? `transform ${spinDuration}ms ${spinProfileCurves[currentProfile]}` : 'none',
            borderColor: borderColor || currentTheme.border,
            backgroundColor: backgroundColor || currentTheme.background
          }}
        >
          {/* Render each wheel segment */}
          {segmentsWithColors.map((segment, index) => {
            const startAngle = index * segmentAngle;
            return (
              <div
                key={segment.id}
                className="absolute top-0 left-0 w-full h-full origin-center text-xs sm:text-sm md:text-base font-medium"
                style={{
                  transform: `rotate(${startAngle}deg)`,
                  color: textColor || currentTheme.text
                }}
              >
                {/* Segment triangle shape */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 -translate-y-0 origin-bottom"
                  style={{
                    background: segment.color,
                    clipPath: `polygon(0 100%, 100% 100%, 50% 0)`,
                    width: `${Math.tan((segmentAngle * Math.PI) / 360) * 100}%`,
                  }}
                />

                {/* Segment label text */}
                <span
                  className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap max-w-[80px] overflow-hidden text-ellipsis sm:max-w-[120px] md:max-w-[160px]"
                  style={{
                    transform: `rotate(${90 + startAngle + segmentAngle / 2}deg) translateY(-${size === 'sm' ? '5rem' : size === 'md' ? '7rem' : '9rem'})`,
                    color: textColor || currentTheme.text
                  }}
                >
                  {segment.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls and result display */}
      <div className="flex flex-col items-center gap-3">
        {/* Animation profile selector */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-muted-foreground">Spin Style:</span>
          <div className="flex gap-1">
            {(['gentle', 'normal', 'wild'] as const).map((profile) => (
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
            variant={soundEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setSoundEnabled(prev => !prev)}
            disabled={isSpinning}
            className="text-xs"
            style={{
              backgroundColor: soundEnabled ? currentTheme.accent : undefined,
              borderColor: currentTheme.accent
            }}
          >
            {soundEnabled ? "ON" : "OFF"}
          </Button>
        </div>

        {/* Spin button */}
        <Button
          variant="default"
          size="lg"
          onClick={spin}
          disabled={isSpinning || segments.length < 2}
          className="px-8 font-semibold"
          style={{
            backgroundColor: currentTheme.accent,
            borderColor: currentTheme.accent
          }}
        >
          {isSpinning ? 'Spinning...' : 'SPIN!'}
        </Button>

        {/* Winner display with animation */}
        {winner && (
          <div className="text-center animate-fade-in relative">
            <p className="text-muted-foreground">Winner:</p>
            <p
              className="text-xl font-bold text-shadow-lg animate-glow winner-text"
              ref={(el) => {
                // Create CSS confetti when winner element is created
                if (el && enableConfetti) {
                  createWinnerConfetti(el, {
                    count: 50,
                    colors: [winner.color || currentTheme.highlight, currentTheme.accent, currentTheme.primary]
                  });
                }
              }}
              style={{
                color: currentTheme.highlight || 'var(--foreground)',
                textShadow: `0 0 10px ${currentTheme.highlight}80, 0 0 20px ${currentTheme.highlight}40`,
                ['--highlight-glow' as any]: currentTheme.highlight || 'currentColor'
              }}>
              {winner.label}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}