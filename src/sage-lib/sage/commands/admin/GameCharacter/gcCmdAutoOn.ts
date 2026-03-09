import { DialogPostType } from "@rsc-sage/data-layer";
import { quote } from "@rsc-utils/core-utils";
import { parseIds, toChannelMention, toUserMention } from "@rsc-utils/discord-utils";
import { deleteMessage } from "../../../../discord/deletedMessages.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { getCharacter } from "./getCharacter.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { promptCharConfirm } from "./promptCharConfirm.js";
import { removeAuto } from "./removeAuto.js";
import { sendGameCharacter } from "./sendGameCharacter.js";
import { sendNotFound } from "./sendNotFound.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";

export async function gcCmdAutoOn(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	const names = sageMessage.args.getNames();
	const alias = sageMessage.args.getString("alias") ?? undefined;
	const dialogPostType = sageMessage.args.getEnum(DialogPostType, "dialogPostType") ?? undefined;
	const userId = sageMessage.canAdminGame ? sageMessage.args.getUserId("user") ?? sageMessage.sageUser.did : sageMessage.sageUser.did;

	const { game } = sageMessage;
	if (game && userId !== sageMessage.sageUser.did) {
		const hasUser = characterTypeMeta.isGmOrNpcOrMinion ? sageMessage.actor.isGameMaster : sageMessage.actor.isGameUser;
		if (!hasUser) {
			return characterTypeMeta.isGmOrNpcOrMinion
				? sageMessage.whisper(`${toUserMention(userId)} isn't a Game Master of the Game.`)
				: sageMessage.whisper(`${toUserMention(userId)} isn't part of the Game.`);
		}
	}

	let character = characterTypeMeta.isGm
		? sageMessage.gmCharacter
		: await getCharacter(sageMessage, characterTypeMeta, userId, names, alias);

	if (!character && characterTypeMeta.isPc) {
		character = sageMessage.playerCharacter;
	}

	if (!character) {
		return sendNotFound(sageMessage, `${characterTypeMeta.singularDescriptor} Auto Dialog (On)`, characterTypeMeta.singularDescriptor!, alias ?? names.name);
	}

	const thisChannelId = sageMessage.channelDid;
	const channelIds = parseIds(sageMessage.message, "channel");
	if (!channelIds.length && thisChannelId) {
		channelIds.push(thisChannelId);
	}
	if (!channelIds.length) {
		return sageMessage.whisper(`Cannot start using Auto Dialog with ${character.name}: No Channels Found!`);
	}
	if (game && channelIds.some(channelId => !game.hasChannel(channelId))) {
		return sageMessage.whisper(`Cannot start using Auto Dialog with ${character.name}: Channel(s) in wrong Game!`);
	}

	/**
	 * We didn't intend to allow user characters with auto dialog into games.
	 * But ... we did by accident and many folks would be sorely upset if we broke it now.
	 * So ... we let them know in case they are doing it by mistake.
	 */
	let userToGameNote = "";
	if (!game) {
		for (const channelId of channelIds) {
			// current channel not in game; see if this channelId has a game
			const channelGame = await sageMessage.eventCache.findActiveGame({ guildId:sageMessage.server?.did, channelId, messageId:undefined });
			if (channelGame) {
				const atLeastThis = channelIds.length > 1 ? "At least one channel" : "This channel";
				userToGameNote = `\n<i>${atLeastThis} is in a Game this Character is not in.</i>`;
				continue;
			}
		}
	}

	const channelLinks = channelIds.map(channelId =>
		"\n> " + toChannelMention(channelId) + (channelId === thisChannelId ? " <i>(this channel)</i>" : "")
	);
	const dialogType = dialogPostType !== undefined ? ` (${DialogPostType[dialogPostType]})` : "";
	const prompt = `Start ${toUserMention(userId)} using Auto Dialog ${dialogType} with ${quote(character.name)} in:${channelLinks.join("")}${userToGameNote}`;

	const removeAutoArgs = { channelIds, game:sageMessage.game, sageUser:sageMessage.sageUser, userId };
	await promptCharConfirm(sageMessage, character, prompt, async char => {
		await removeAuto(removeAutoArgs);
		for (const channelId of channelIds) {
			await char.setAutoChannel({ channelId, dialogPostType, userId }, false);
		}
		return char.save();
	});

	const deleted = await deleteMessage(sageMessage.message);
	if (deleted === 1) {
		await sendGameCharacter(sageMessage, character);
	}

}