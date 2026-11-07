// Keyboard handling utilities (already integrated into App.tsx).
// This file exists for modularity.

export function initKeyboard(onDown: (e: KeyboardEvent) => void, onUp: (e: KeyboardEvent) => void) {
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
}

export function cleanupKeyboard(onDown: (e: KeyboardEvent) => void, onUp: (e: KeyboardEvent) => void) {
  window.removeEventListener('keydown', onDown);
  window.removeEventListener('keyup', onUp);
}