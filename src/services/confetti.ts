/**
 * Confetti Service for the spinner application
 * Handles confetti animations for winner celebrations
 */

import confetti from 'canvas-confetti';

/**
 * Default confetti options for a standard celebration
 */
const defaultConfettiOptions = {
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#FF5733', '#33FF57', '#5733FF', '#FFFF33', '#33FFFF'],
  disableForReducedMotion: true,
};

/**
 * Types of confetti celebrations
 */
export type ConfettiType = 'default' | 'explosion' | 'cannon' | 'fireworks' | 'rain';

/**
 * Trigger a basic confetti celebration
 */
export const triggerConfetti = (options = {}) => {
  confetti({
    ...defaultConfettiOptions,
    ...options,
  });
};

/**
 * Trigger a large confetti explosion
 */
export const triggerConfettiExplosion = () => {
  confetti({
    ...defaultConfettiOptions,
    particleCount: 200,
    spread: 100,
    origin: { y: 0.5 },
    scalar: 1.2,
  });
};

/**
 * Create a confetti cannon that shoots from the sides
 */
export const triggerConfettiCannon = () => {
  // Left side cannon
  confetti({
    ...defaultConfettiOptions,
    particleCount: 80,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 0.7 },
  });

  // Right side cannon
  confetti({
    ...defaultConfettiOptions,
    particleCount: 80,
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 0.7 },
  });
};

/**
 * Create a fireworks display with multiple confetti bursts
 */
export const triggerConfettiFireworks = () => {
  // Initial burst
  triggerConfetti();

  // Sequential bursts
  setTimeout(() => {
    confetti({
      ...defaultConfettiOptions,
      particleCount: 50,
      spread: 100,
      origin: { x: 0.3, y: 0.5 },
      colors: ['#FF0000', '#FF7700', '#FFFF00'],
    });
  }, 500);

  setTimeout(() => {
    confetti({
      ...defaultConfettiOptions,
      particleCount: 50,
      spread: 100,
      origin: { x: 0.7, y: 0.5 },
      colors: ['#00FF00', '#0077FF', '#7700FF'],
    });
  }, 900);

  setTimeout(() => {
    triggerConfettiExplosion();
  }, 1400);
};

/**
 * Create a gentle rain of confetti from the top
 */
export const triggerConfettiRain = () => {
  const duration = 3000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      ...defaultConfettiOptions,
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0 },
      colors: ['#0000FF', '#00FFFF'],
    });

    confetti({
      ...defaultConfettiOptions,
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0 },
      colors: ['#FF00FF', '#FF0000'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
};

/**
 * Trigger a specific type of confetti animation
 * @param type Type of confetti animation to trigger
 */
export const triggerConfettiByType = (type: ConfettiType = 'default') => {
  switch (type) {
    case 'explosion':
      triggerConfettiExplosion();
      break;
    case 'cannon':
      triggerConfettiCannon();
      break;
    case 'fireworks':
      triggerConfettiFireworks();
      break;
    case 'rain':
      triggerConfettiRain();
      break;
    default:
      triggerConfetti();
      break;
  }
};