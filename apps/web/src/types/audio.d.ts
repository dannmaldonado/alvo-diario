/**
 * AudioContext TypeScript definitions
 * Extends Web Audio API support for StudySessionPage
 */

declare global {
  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}

export {};
