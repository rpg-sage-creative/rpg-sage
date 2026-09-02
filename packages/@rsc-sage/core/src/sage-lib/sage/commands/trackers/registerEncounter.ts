import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import { registerEncounterStartStopButton } from "./encounter/eBtnStartStop.js";
import { eCmdAdd } from "./encounter/eCmdAdd.js";
import { eCmdCreate } from "./encounter/eCmdCreate.js";
import { eCmdDelete } from "./encounter/eCmdDelete.js";
import { eCmdList } from "./encounter/eCmdList.js";
import { eCmdRemove } from "./encounter/eCmdRemove.js";
import { eCmdStatus } from "./encounter/eCmdStatus.js";

export function registerEncounter(): void {
	return;
	registerListeners({ commands:["encounter|list"], message:eCmdList });
	registerListeners({ commands:["encounter|status", "encounter|status|pin", "encounter|status|unpin", "encounter|status|unpin|all"], message:eCmdStatus });
	registerListeners({ commands:["encounter|create", "create|encounter"], message:eCmdCreate });
	registerListeners({ commands:["encounter|delete", "delete|encounter"], message:eCmdDelete });
	registerListeners({ commands:["encounter|add"], message:eCmdAdd });
	registerListeners({ commands:["encounter|remove"], message:eCmdRemove });

	registerEncounterStartStopButton();
}