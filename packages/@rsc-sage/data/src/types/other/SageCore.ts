import type { IdCore } from "@rsc-utils/core-utils";

export type SageCore<
			ObjectType extends string,
			IdType extends string
		> = IdCore<ObjectType> & {
			id: IdType;
			/** Date.now() when this object was created */
			createdTs?: number;
			/** Date.now() when this object was updated */
			updatedTs?: number;
		};
