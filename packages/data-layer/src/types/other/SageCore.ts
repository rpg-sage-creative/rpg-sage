import type { IdCore } from "@rsc-utils/core-utils";
import type { HasVer } from "./HasVer.js";

export type SageCore<ObjectType extends string, IdType extends string> = IdCore<ObjectType> & HasVer & { id:IdType; };
