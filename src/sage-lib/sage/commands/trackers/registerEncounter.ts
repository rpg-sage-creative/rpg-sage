import { registerAdminCommand } from "../cmd";
import { registerEncounterStartStopButton } from "./encounter/eBtnStartStop";
import { eCmdAdd } from "./encounter/eCmdAdd";
import { eCmdCreate } from "./encounter/eCmdCreate";
import { eCmdDelete } from "./encounter/eCmdDelete";
import { eCmdList } from "./encounter/eCmdList";
import { eCmdRemove } from "./encounter/eCmdRemove";
import { eCmdStatus } from "./encounter/eCmdStatus";

export function registerEncounter(): void {
	registerAdminCommand(eCmdList, "encounter-list");
	registerAdminCommand(eCmdStatus, "encounter-status", "encounter-status-pin", "encounter-status-unpin", "encounter-status-unpin-all");
	registerAdminCommand(eCmdCreate, "encounter-create", "create-encounter");
	registerAdminCommand(eCmdDelete, "encounter-delete", "delete-encounter");
	registerAdminCommand(eCmdAdd, "encounter-add");
	registerAdminCommand(eCmdRemove, "encounter-remove");

	registerEncounterStartStopButton();
}