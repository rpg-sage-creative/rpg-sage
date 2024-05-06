/** @internal @private Represents an object or a promise to get that object. */
export type Awaitable<T> = T | PromiseLike<T>;
