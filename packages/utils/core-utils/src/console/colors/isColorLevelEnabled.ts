import type { LogLevelName } from "../logLevels/LogLevel.js";
import { getColorLevels } from "./colorLevels.js";

/** @internal Checks to see if a given log level is allowed to have color. */
export function isColorLevelEnabled(colorLevel: LogLevelName): boolean {
	return getColorLevels()?.has(colorLevel) === true;
}