import { mapSageChannelNameTags } from "../../../model/Game.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { Encounter } from "./Encounter.js";
import { addButtons } from "./addButtons.js";

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

	const encounterName = sageMessage.args.getString("name");
	const encounter = game.encounters.getOrFirst(encounterName);

	const channelId = sageMessage.message.mentions.channels.first()?.id ?? sageMessage.message.channelId;

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
	const sentMessage = await sageMessage.sendPost(encounter.renderInit());
	if (sentMessage) {
		const gmMode = sageMessage.gameChannel ? mapSageChannelNameTags(sageMessage.gameChannel).gm : false;
		addButtons(encounter, sentMessage[0], gmMode);
		if (isPin) {
			// pin posted status
			const pinned = await encounter.pin("init", sentMessage[0]);
			if (pinned) {
				const saved = await game.save();
				await sageMessage.reactSuccessOrFailure(saved);
			}else {
				await sageMessage.reactWarn("Sorry, something went wrong pinning status.");
			}
		}
	}

}