import type { LogLevelName } from "../logLevels/LogLevel.js";
import { getColorLevels } from "./colorLevels.js";

/**
 * Enables the given log level to have color.
 */
export function enableColorLevel(...colorLevels: LogLevelName[]): void {
	const _colorLevels = getColorLevels(true);
	colorLevels.forEach(colorLevel => _colorLevels.add(colorLevel));
}