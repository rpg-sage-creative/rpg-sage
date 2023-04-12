import { register as registerAdmin } from "./admin";
import { registerCommandHandlers as registerCharForm } from "./admin/character/charListForm";
import { registerCommandHandlers as registerCharModal, registerSlashCommands as registerCharModalSlashCommands } from "./admin/character/charModal";
import { registerCommandHandlers as registerCal, registerSlashCommands as registerCalSlashCommands } from "./cal";
import { register as registerCmd } from "./cmd";
import { registerCommandHandlers as registerDcs, registerSlashCommands as registerDcsSlashCommands } from "./dcs";
import { registerCommandHandlers as registerDefault, registerSlashCommands as registerDefaultSlashCommands } from "./default";
import { register as registerDialog } from "./dialog";
import { registerCommandHandlers as registerDialogModal } from "./dialogModal";
import { register as registerDice } from "./dice";
import { registerCommandHandlers as registerE20 } from "./e20";
import { registerCommandHandlers as registerHelp, registerSlashCommands as registerHelpSlashCommands } from "./help";
import { registerCommandHandlers as registerImport, registerSlashCommands as registerImportSlashCommands } from "./import";
import { registerCommandHandlers as registerMap, registerSlashCommands as registerMapSlashCommands } from "./map";
import { registerCommandHandlers as registerPathbuilder } from "./pathbuilder";
import { register as registerPfs } from "./pfs";
import { register as registerSpells } from "./spells";
import { register as registerWealth } from "./wealth";
import { registerCommandHandlers as registerWeather, registerSlashCommands as registerWeatherSlashCommands } from "./weather";

import { registerCommandHandlers as registerSageCommand } from "../model/SageCommand";

export function registerCommandHandlers(): void {
	registerAdmin();
	registerCal();
	registerCharForm();
	registerCharModal();
	registerCmd();
	registerDcs();
	registerDefault();
	registerDialog();
	registerDialogModal();
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
	registerCharModalSlashCommands();
	registerDcsSlashCommands();
	registerDefaultSlashCommands();
	registerHelpSlashCommands();
	registerImportSlashCommands();
	registerMapSlashCommands();
	registerWeatherSlashCommands();
}