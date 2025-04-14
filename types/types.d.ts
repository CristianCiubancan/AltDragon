// Add global alt object for alt:V
declare const alt: {
  on(eventName: string, listener: (...args: any[]) => void): void;
  // Add more methods as needed
};

// Also define module types if you need to import them
declare module 'alt-client' {
  export function on(eventName: string, listener: (...args: any[]) => void): void;
  // Add more types as needed
}

declare module 'alt-server' {
  export function on(eventName: string, listener: (...args: any[]) => void): void;
  // Add more types as needed
}

declare module 'alt-shared' {
  // Add types as needed
}

declare module 'alt-natives' {
  // Add types as needed
}