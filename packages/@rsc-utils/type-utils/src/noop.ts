/** Reusable non-operation function. */
export function noop(): void;
export function noop<T extends undefined = undefined>(): T;
export function noop() { }