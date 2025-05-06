import { registerGameSystems } from "../../../gameSystems/registerGameSystems.js";
import { registerDeleteButtonHandler } from "../model/utils/deleteButton.js";
import { registerAdmin } from "./admin/index.js";
import { registerCal } from "./cal.js";
import { registerDeckCommands } from "./deck.js";
import { registerDefault } from "./default.js";
import { registerDeleteAfter } from "./deleteAfter.js";
import { registerDialog } from "./dialog.js";
import { registerDeleteReaction } from "./dialog/processDelete.js";
import { registerPinReaction } from "./dialog/processPin.js";
import { registerDialogLookup } from "./dialogLookup.js";
import { registerDice } from "./dice.js";
import { registerE20 } from "./e20.js";
import { registerHelpCommands } from "./help.js";
import { registerImport } from "./import.js";
import { registerMap } from "./map.js";
import { registerPathbuilder } from "./pathbuilder.js";
import { registerPfsCommands } from "./pfs/index.js";
import { registerSpells } from "./spells.js";
import { registerEncounter } from "./trackers/registerEncounter.js";
import { registerParty } from "./trackers/registerParty.js";
import { registerWealth } from "./wealth.js";
import { registerCommandHandlers as registerWeather } from "./weather.js";

export function registerCommandHandlers(): void {
	registerAdmin();
	registerCal();
	registerDeckCommands();
	registerDefault();
	registerDeleteReaction();
	registerDialog();
	registerDice();
	registerEncounter();
	registerE20();
	registerGameSystems();
	registerHelpCommands();
	registerImport();
	registerMap();
	registerParty();
	registerPathbuilder();
	registerPinReaction();
	registerPfsCommands();
	registerSpells();
	registerWealth();
	registerWeather();

	registerDeleteButtonHandler();
	registerDeleteAfter();
	registerDialogLookup();
}

