import { registerCalSlashCommands } from "./registerCalSlashCommands.js";
import { registerDcsSlashCommands } from "./registerDcsSlashCommands.js";
import { registerDefaultSlashCommands } from "./registerDefaultSlashCommands";
import { registerHelpSlashCommands } from "./registerHelpSlashCommands.js";
import { registerImportSlashCommands } from "./registerImportSlashCommands.js";
import { registerMapSlashCommands } from "./registerMapSlashCommands.js";
import { registerWeatherSlashCommands } from "./registerWeatherSlashCommands.js";

export function registerSlashCommands(): void {
	registerCalSlashCommands();
	registerDcsSlashCommands();
	registerDefaultSlashCommands();
	registerHelpSlashCommands();
	registerImportSlashCommands();
	registerMapSlashCommands();
	registerWeatherSlashCommands();
}