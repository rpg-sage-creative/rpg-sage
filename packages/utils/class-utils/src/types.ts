import { type Matcher } from "@rsc-utils/core-utils";

/** A core with a name */
export interface NameCore {
	/** The name of the object. */
	name: string;
}

export interface IHasNameCore {

	/** The name of the object. */
	name: string;

	/** This must check to see if the value matches the name, nameClean (when cleaned), or nameLower (when lowered) */
	matches(value: Matcher): boolean;
}
