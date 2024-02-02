import type { LogLevelName } from "../logLevels/LogLevel.js";
import { getColorLevels } from "./colorLevels.js";

/** Disables the given log level from having color. */
export function disableColorLevel(...colorLevels: LogLevelName[]): void {
	const _colorLevels = getColorLevels();
	if (_colorLevels?.size) {
		colorLevels.forEach(colorLevel => _colorLevels.delete(colorLevel));
	}
}
