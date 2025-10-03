// src/polyfills.ts

// Polyfill for Amplify to use in browser/Angular environment
(window as any).global = window;
(window as any).process = {
  env: { DEBUG: undefined },
} as any;

// Required for Angular Zone.js
import 'zone.js';
