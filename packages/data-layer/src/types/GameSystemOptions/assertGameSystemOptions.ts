import { assertNumber, optional } from "../../validation/index.js";
import { GameSystemType } from "../enums/GameSystem.js";
import type { GameSystemOptionsAny } from "./GameSystemOptions.js";

/** gameSystemType */
export function assertGameSystemOptions({ core, objectType }: { core:GameSystemOptionsAny; objectType:string; }): boolean {

	if (!assertNumber({ core, objectType, key:"gameSystemType", optional, validator:GameSystemType })) return false;

	return true;
}