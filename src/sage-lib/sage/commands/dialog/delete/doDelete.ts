import { deleteMessage } from "../../../../discord/deletedMessages";
import type { SageReaction } from "../../../model/SageReaction";

export async function doDelete(sageReaction: SageReaction): Promise<void> {
	await deleteMessage(sageReaction.messageReaction.message);
}