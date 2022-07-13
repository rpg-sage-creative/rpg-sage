import registerAdmin from "./admin";
import { registerCommandHandlers as registerCal, registerSlashCommands as registerCalSlashCommands } from "./cal";
import registerCmd from "./cmd";
import { registerCommandHandlers as registerDcs, registerSlashCommands as registerDcsSlashCommands } from "./dcs";
import { registerCommandHandlers as registerDefault, registerSlashCommands as registerDefaultSlashCommands } from "./default";
import registerDialog from "./dialog";
import registerDice from "./dice";
import { registerCommandHandlers as registerHelp, registerSlashCommands as registerHelpSlashCommands } from "./help";
import { registerCommandHandlers as registerMap, registerSlashCommands as registerMapSlashCommands } from "./map";
import { registerCommandHandlers as registerPathbuilder, registerSlashCommands as registerPathbuilderSlashCommands } from "./pathbuilder";
import registerPfs from "./pfs";
import registerSpells from "./spells";
import registerWealth from "./wealth";
import { registerCommandHandlers as registerWeather, registerSlashCommands as registerWeatherSlashCommands } from "./weather";

export function registerCommandHandlers(): void {
	registerAdmin();
	registerCal();
	registerCmd();
	registerDcs();
	registerDefault();
	registerDialog();
	registerDice();
	registerHelp();
	registerMap();
	registerPathbuilder();
	registerPfs();
	registerSpells();
	registerWealth();
	registerWeather();
}

export function registerSlashCommands(): void {
	registerCalSlashCommands();
	registerDcsSlashCommands();
	registerDefaultSlashCommands();
	registerHelpSlashCommands();
	registerMapSlashCommands();
	registerPathbuilderSlashCommands();
	registerWeatherSlashCommands();
}