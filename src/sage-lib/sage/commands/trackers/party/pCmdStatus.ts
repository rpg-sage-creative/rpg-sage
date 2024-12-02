import type { SageMessage } from "../../../model/SageMessage.js";
import { Party } from "./Party.js";


async function unpinChannel(sageMessage: SageMessage, channelId: string) {
	const game = sageMessage.game;
	const parties = game?.parties.all;
	if (parties?.length) {
		let hasPins = false;
		let changes = false;
		for (const party of parties) {
			if (party.getPin("status", channelId)) {
				hasPins = true;
				if (await party.unpin("status", channelId)) {
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

async function unpinParty(sageMessage: SageMessage, party: Party | null, channelId: string) {
	const hasPin = party?.getPin("status", channelId);
	if (hasPin) {
		const unpinned = await party!.unpin("status", channelId);
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

export async function pCmdStatus(sageMessage: SageMessage): Promise<void> {
	const game = sageMessage.game;
	if (!game) {
		return sageMessage.denyByProv("Party Status", "Party commands not allowed outside a Game.");
	}

	if (!sageMessage.canAdminGame && !sageMessage.playerCharacter) {
		return sageMessage.denyForGame("Party Status");
	}

	const { command } = sageMessage;
	const isPin = (/\bpin\b/i).test(command);
	const isUnpin = (/\bunpin\b$/i).test(command);
	const isUnpinAll = (/\bunpin[-.]?all\b/i).test(command);

	const partyName = sageMessage.args.getString("name");
	const party = game.parties.getOrDefault(partyName);

	const channelId = sageMessage.message.mentions.channels.first()?.id ?? sageMessage.message.channelId;

	if (isUnpinAll) {
		// unpin all status posts for all parties in this channel
		await unpinChannel(sageMessage, channelId);
		return;
	}

	if (isUnpin) {
		// unpin the status post for the given party in this channel
		await unpinParty(sageMessage, party, channelId);
		return;
	}

	if (!party) {
		await sageMessage.reactFailure(`Party not found.`);
		return;
	}

	//post status
	const sentMessage = await sageMessage.sendPost(party.renderStatus());
	if (isPin && sentMessage?.length) {
		// pin posted status
		const pinned = await party.pin("status", sentMessage[0]);
		if (pinned) {
			const saved = await game.save();
			await sageMessage.reactSuccessOrFailure(saved);
		}else {
			await sageMessage.reactWarn("Sorry, something went wrong pinning status.");
		}
	}

}