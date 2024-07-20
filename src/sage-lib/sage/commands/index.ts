import { registerDeleteButtonHandler } from "../model/utils/deleteButton";
import { registerAdmin } from "./admin";
import { registerCal } from "./cal";
import { registerDcs } from "./dcs";
import { registerDefault } from "./default";
import { registerDeleteAfter } from "./deleteAfter";
import { registerDialog } from "./dialog";
import { registerDice } from "./dice";
import { registerE20 } from "./e20";
import { registerHelpCommands } from "./help";
import { registerImport } from "./import";
import { registerMap } from "./map";
import { registerPathbuilder } from "./pathbuilder";
import { registerPfsCommands } from "./pfs";
import { registerSpells } from "./spells";
import { registerEncounter } from "./trackers/registerEncounter";
import { registerParty } from "./trackers/registerParty";
import { registerWealth } from "./wealth";
import { registerCommandHandlers as registerWeather } from "./weather";

export function registerCommandHandlers(): void {
	registerAdmin();
	registerCal();
	registerDcs();
	registerDefault();
	registerDialog();
	registerDice();
	registerEncounter();
	registerE20();
	registerHelpCommands();
	registerImport();
	registerMap();
	registerParty();
	registerPathbuilder();
	registerPfsCommands();
	registerSpells();
	registerWealth();
	registerWeather();

	registerDeleteButtonHandler();
	registerDeleteAfter();
}

