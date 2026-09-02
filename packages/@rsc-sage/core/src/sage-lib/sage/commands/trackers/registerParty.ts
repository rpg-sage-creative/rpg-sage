import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import { pCmdAdd } from "./party/pCmdAdd.js";
import { pCmdCreate } from "./party/pCmdCreate.js";
import { pCmdDelete } from "./party/pCmdDelete.js";
import { pCmdList } from "./party/pCmdList.js";
import { pCmdLoot } from "./party/pCmdLoot.js";
import { pCmdRemove } from "./party/pCmdRemove.js";
import { pCmdStatus } from "./party/pCmdStatus.js";

export function registerParty(): void {
	registerListeners({ commands:["party|status", "party|status|pin", "party|status|unpin", "party|status|unpin|all"], message:pCmdStatus });
	return;
	registerListeners({ commands:["party|list"], message:pCmdList });
	registerListeners({ commands:["party|loot"], message:pCmdLoot });
	registerListeners({ commands:["party|create", "create|party"], message:pCmdCreate });
	registerListeners({ commands:["party|delete", "delete|party"], message:pCmdDelete });
	registerListeners({ commands:["party|add"], message:pCmdAdd });
	registerListeners({ commands:["party|remove"], message:pCmdRemove });
}