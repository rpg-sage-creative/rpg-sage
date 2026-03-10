import { registerGameSystems } from "../../../gameSystems/registerGameSystems.js";
import { registerDeleteButtonHandler } from "../model/utils/deleteButton.js";
import { registerAdmin } from "./admin/index.js";
import { registerShutdown } from "./admin/shutdown.js";
import { registerCal } from "./cal.js";
import { registerDeckCommands } from "./deck.js";
import { registerDeleteAfter } from "./deleteAfter.js";
import { registerDialog } from "./dialog.js";
import { registerDeleteReaction } from "./dialog/processDelete.js";
import { registerPinReaction } from "./dialog/processPin.js";
import { registerDialogLookup } from "./dialogLookup.js";
import { registerDice } from "./dice.js";
import { registerE20 } from "./e20.js";
import { registerHelpCommands } from "./help.js";
import { registerHephaistos } from "./hephaistos.js";
import { registerImport } from "./import.js";
import { registerMap } from "./map.js";
import { registerPathbuilder } from "./pathbuilder.js";
import { registerFind } from "./search/find.js";
import { registerSearch } from "./search/search.js";
import { registerSlashDm } from "./slashDm.js";
import { registerEncounter } from "./trackers/registerEncounter.js";
import { registerParty } from "./trackers/registerParty.js";
import { registerWealth } from "./wealth.js";
import { registerCommandHandlers as registerWeather } from "./weather.js";

export function registerCommandHandlers(): void {
	registerAdmin();
	registerCal();
	registerDeckCommands();
	registerDeleteReaction();
	registerDialog();
	registerDice();
	registerEncounter();
	registerE20();
	registerFind();
	registerGameSystems();
	registerHelpCommands();
	registerHephaistos();
	registerImport();
	// registerListObjectsBy();
	registerMap();
	registerParty();
	registerPathbuilder();
	registerPinReaction();
	// registerPfsCommands();
	registerSearch();
	registerShutdown();
	registerSlashDm();
	// registerSpells();
	registerWealth();
	registerWeather();

	registerDeleteButtonHandler();
	registerDeleteAfter();
	registerDialogLookup();
}

