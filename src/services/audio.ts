/**
 * Audio Service for the spinner application
 * Handles loading and playing of sound effects
 */

// Cached audio instances
const audioCache: Record<string, HTMLAudioElement> = {};

// Available sound effects
export type SoundEffect = 'wheel-start' | 'wheel-tick' | 'wheel-end' | 'slot-start' | 'slot-tick' | 'slot-end';

/**
 * Preloads sound effects for faster playback
 * @param sounds Array of sound effects to preload
 */
export const preloadSounds = (sounds: SoundEffect[]) => {
  sounds.forEach(sound => {
    if (!audioCache[sound]) {
      const audio = new Audio(`/sounds/${sound}.mp3`);
      audio.load();
      audioCache[sound] = audio;
    }
  });
};

/**
 * Plays a sound effect
 * @param sound The sound effect to play
 * @param volume Optional volume level (0.0 to 1.0)
 * @returns Promise that resolves when the sound starts playing
 */
export const playSound = async (sound: SoundEffect, volume = 1.0): Promise<void> => {
  try {
    // Create or get cached audio instance
    if (!audioCache[sound]) {
      audioCache[sound] = new Audio(`/sounds/${sound}.mp3`);
    }
    
    const audio = audioCache[sound];
    
    // Reset audio to start (in case it was already playing)
    audio.currentTime = 0;
    audio.volume = Math.min(1, Math.max(0, volume));
    
    // Play the sound
    return audio.play();
  } catch (error) {
    console.error(`Error playing sound '${sound}':`, error);
  }
};

/**
 * Stops a currently playing sound effect
 * @param sound The sound effect to stop
 */
export const stopSound = (sound: SoundEffect): void => {
  if (audioCache[sound]) {
    audioCache[sound].pause();
    audioCache[sound].currentTime = 0;
  }
};

/**
 * Preloads all wheel-related sound effects
 */
export const preloadWheelSounds = () => {
  preloadSounds(['wheel-start', 'wheel-tick', 'wheel-end']);
};

/**
 * Preloads all slot machine-related sound effects
 */
export const preloadSlotSounds = () => {
  preloadSounds(['slot-start', 'slot-tick', 'slot-end']);
};

/**
 * Stops all currently playing sounds
 */
export const stopAllSounds = (): void => {
  Object.values(audioCache).forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
};

// Preload common sounds on module import
preloadWheelSounds();