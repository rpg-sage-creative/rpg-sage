import type { Matcher } from "../types/Matcher.js";

/** A core with a name */
export type NameCore = {
	/** The name of the object. */
	name: string;
};

export interface HasNameCore {

	/** The name of the object. */
	name: string;

	/** This must check to see if the value matches the name, nameClean (when cleaned), or nameLower (when lowered) */
	matches(value: Matcher): boolean;
}
