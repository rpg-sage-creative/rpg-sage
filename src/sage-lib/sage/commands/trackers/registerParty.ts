import { registerAdminCommand } from "../cmd";
import { pCmdAdd } from "./party/pCmdAdd";
import { pCmdCreate } from "./party/pCmdCreate";
import { pCmdDelete } from "./party/pCmdDelete";
import { pCmdList } from "./party/pCmdList";
import { pCmdLoot } from "./party/pCmdLoot";
import { pCmdRemove } from "./party/pCmdRemove";
import { pCmdStatus } from "./party/pCmdStatus";

export function registerParty(): void {
	return;
	registerAdminCommand(pCmdList, "party-list");
	registerAdminCommand(pCmdLoot, "party-loot");
	registerAdminCommand(pCmdStatus, "party-status", "party-status-pin", "party-status-unpin", "party-status-unpin-all");
	registerAdminCommand(pCmdCreate, "party-create", "create-party");
	registerAdminCommand(pCmdDelete, "party-delete", "delete-party");
	registerAdminCommand(pCmdAdd, "party-add");
	registerAdminCommand(pCmdRemove, "party-remove");
}