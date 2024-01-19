import type { SageReaction } from "../../../model/SageReaction";

export async function doPin(sageReaction: SageReaction): Promise<void> {
	if (sageReaction.isAdd) {
		await sageReaction.messageReaction.message.pin();
	} else if (sageReaction.isRemove) {
		await sageReaction.messageReaction.message.unpin();
	}
}