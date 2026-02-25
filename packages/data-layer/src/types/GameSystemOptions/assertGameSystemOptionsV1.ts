import { assertNumber, optional } from "../../validation/index.js";
import { GameSystemType } from "../enums/GameSystem.js";
import type { GameSystemOptionsAny, GameSystemOptionsV1 } from "./GameSystemOptions.js";

/** gameSystemType */
export function assertGameSystemOptionsV1(objectType: string, core: GameSystemOptionsAny): core is GameSystemOptionsV1 {

	if (!assertNumber({ core, objectType, key:"gameSystemType", optional, validator:GameSystemType })) return false;

	return true;
}