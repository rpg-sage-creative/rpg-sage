import type { IdCore } from "@rsc-utils/core-utils";

export type SageCore<ObjectType extends string, IdType extends string> = IdCore<ObjectType> & { id:IdType; };
