import type SageMessage from "../../../model/SageMessage";
import { Encounter } from "./Encounter";

async function unpinChannel(sageMessage: SageMessage, channelId: string) {
	const game = sageMessage.game;
	const encounters = game?.encounters.all;
	if (encounters?.length) {
		let hasPins = false;
		let changes = false;
		for (const encounter of encounters) {
			if (encounter.getPin("init", channelId)) {
				hasPins = true;
				if (await encounter.unpin("init", channelId)) {
					changes = true;
				}
			}
		}
		if (changes) {
			const saved = await game!.save();
			await sageMessage.reactSuccessOrFailure(saved);
		}else if (hasPins) {
			await sageMessage.reactWarn("Sorry, something went wrong unpinning status.");
		}
	}else {
		await sageMessage.reactFailure("Nothing to unpin.");
	}
}

async function unpinEncounter(sageMessage: SageMessage, encounter: Encounter | null, channelId: string) {
	const hasPin = encounter?.getPin("init", channelId);
	if (hasPin) {
		const unpinned = await encounter!.unpin("init", channelId);
		if (unpinned) {
			const saved = await sageMessage.game!.save();
			await sageMessage.reactSuccessOrFailure(saved);
		}else {
			await sageMessage.reactWarn("Sorry, something went wrong unpinning status.");
		}

	}else {
		await sageMessage.reactFailure("Nothing to unpin.");
	}

}

export async function eCmdStatus(sageMessage: SageMessage): Promise<void> {
	const game = sageMessage.game;
	if (!game) {
		return sageMessage.denyByProv("Encounter Status", "Encounter commands not allowed outside a Game.");
	}

	if (!sageMessage.canAdminGame && !sageMessage.playerCharacter) {
		return sageMessage.denyForGame("Encounter Status");
	}

	const { command } = sageMessage;
	const isPin = (/\bpin\b/i).test(command);
	const isUnpin = (/\bunpin\b$/i).test(command);
	const isUnpinAll = (/\bunpin[-.]?all\b/i).test(command);

	const encounterName = sageMessage.args.removeAndReturnName();
	const encounter = game.encounters.getOrFirst(encounterName);

	const channelId = await sageMessage.args.removeAndReturnChannelDid(true);

	if (isUnpinAll) {
		// unpin all status posts for all encounters in this channel
		await unpinChannel(sageMessage, channelId);
		return;
	}

	if (isUnpin) {
		// unpin the status post for the given encounter in this channel
		await unpinEncounter(sageMessage, encounter, channelId);
		return;
	}

	if (!encounter) {
		await sageMessage.reactFailure(`Encounter not found.`);
		return;
	}

	//post status
	const sentMessage = await sageMessage.sendPost(encounter.renderInit()) ?? undefined;
	if (isPin && sentMessage) {
		// pin posted status
		const pinned = await encounter.pin("init", sentMessage);
		if (pinned) {
			const saved = await game.save();
			await sageMessage.reactSuccessOrFailure(saved);
		}else {
			await sageMessage.reactWarn("Sorry, something went wrong pinning status.");
		}
	}

}