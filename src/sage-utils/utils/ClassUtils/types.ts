//#region HasCore

import type { UUID } from "../types";

/** The most basic Core used. */
export interface Core<T extends string = string> {
	/** The type of data that is represented. Often the Class that the Core is for. */
	objectType: T;
}

//#endregion

//#region HasIdCore

/** The second most basic Core used. */
export interface IdCore<T extends string = string> extends Core<T> {
	/** The unique identifier for this object. */
	id: UUID;
}

//#endregion
