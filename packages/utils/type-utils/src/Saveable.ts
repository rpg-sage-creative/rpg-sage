import { Awaitable } from "./generics.js";

/** Represents an object that can be saved. */
export type Saveable = {
	/** Attempts to save the object, returning true if successful, or false otherwise. */
	save(): Awaitable<boolean>;
};