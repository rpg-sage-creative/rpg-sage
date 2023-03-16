import registerAdmin from "./admin";
import { registerCommandHandlers as registerCal, registerSlashCommands as registerCalSlashCommands } from "./cal";
import registerCmd from "./cmd";
import { registerCommandHandlers as registerDcs, registerSlashCommands as registerDcsSlashCommands } from "./dcs";
import { registerCommandHandlers as registerDefault, registerSlashCommands as registerDefaultSlashCommands } from "./default";
import registerDialog from "./dialog";
import registerDice from "./dice";
import { registerCommandHandlers as registerE20 } from "./e20";
import { registerCommandHandlers as registerHelp, registerSlashCommands as registerHelpSlashCommands } from "./help";
import { registerCommandHandlers as registerImport, registerSlashCommands as registerImportSlashCommands } from "./import";
import { registerCommandHandlers as registerMap, registerSlashCommands as registerMapSlashCommands } from "./map";
import { registerCommandHandlers as registerPathbuilder } from "./pathbuilder";
import registerPfs from "./pfs";
import registerSpells from "./spells";
import registerWealth from "./wealth";
import { registerCommandHandlers as registerWeather, registerSlashCommands as registerWeatherSlashCommands } from "./weather";

import { registerCommandHandlers as registerSageCommand } from "../model/SageCommand";

export function registerCommandHandlers(): void {
	registerAdmin();
	registerCal();
	registerCmd();
	registerDcs();
	registerDefault();
	registerDialog();
	registerDice();
	registerE20();
	registerHelp();
	registerImport();
	registerMap();
	registerPathbuilder();
	registerPfs();
	registerSpells();
	registerWealth();
	registerWeather();

	registerSageCommand();
}

export function registerSlashCommands(): void {
	registerCalSlashCommands();
	registerDcsSlashCommands();
	registerDefaultSlashCommands();
	registerHelpSlashCommands();
	registerImportSlashCommands();
	registerMapSlashCommands();
	registerWeatherSlashCommands();
}