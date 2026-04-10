// Centralised time functions — injectable in tests.
let _now: (() => Date) | null = null;

export function now(): string {
  return (_now ? _now() : new Date()).toISOString();
}

/** Override in tests: `setNow(() => new Date("2024-01-01"))` */
export function setNow(fn: () => Date): void {
  _now = fn;
}

export function resetNow(): void {
  _now = null;
}
