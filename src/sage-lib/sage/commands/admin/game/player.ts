import { toHumanReadable } from "@rsc-utils/discord-utils";
import type { Snowflake } from "@rsc-utils/snowflake-utils";
import type { SageMessage } from "../../../model/SageMessage";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd";
import { registerAdminCommandHelp } from "../../help";

export async function gameUserList(sageMessage: SageMessage, who: string, userDids: Snowflake[] = []): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	const game = sageMessage.game!;
	if (userDids.length) {
		for (const userDid of userDids) {
			const guildMember = await sageMessage.discord.fetchGuildMember(userDid);
			const title = guildMember ? `${toHumanReadable(guildMember.user)}` : userDid;
			const renderableContent = createAdminRenderableContent(game, title);
			renderableContent.append(`<b>User Id</b> ${userDid}`);
			if (guildMember) {
				renderableContent.setThumbnailUrl(guildMember.user.displayAvatarURL());
			}
			sageMessage.send(renderableContent);
		}
	} else {
		const renderableContent = createAdminRenderableContent(game, `<b>list-${who.toLowerCase().replace(" ", "-")}</b>`);
		renderableContent.append(`<blockquote>No ${who} Found!</blockquote>`);
		sageMessage.send(renderableContent);
	}
	return Promise.resolve();
}

async function playerList(sageMessage: SageMessage): Promise<void> {
	return gameUserList(sageMessage, "Players", sageMessage.game?.players);
}

async function playerAdd(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	const users = Array.from(sageMessage.message.mentions.users.values());
	const added = await sageMessage.game!.addPlayers(users.map(user => user.id));
	return sageMessage.reactSuccessOrFailure(added);
}

async function playerRemove(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	const users = Array.from(sageMessage.message.mentions.users.values());
	const removed = await sageMessage.game!.removePlayers(users.map(user => user.id));
	return sageMessage.reactSuccessOrFailure(removed);
}

export function registerPlayer(): void {
	registerAdminCommand(playerList, "player-list", "players-list");
	registerAdminCommandHelp("Admin", "Player", "player list");

	registerAdminCommand(playerAdd, "player-add", "players-add");
	registerAdminCommandHelp("Admin", "Player", "player add {@PlayerMention} {@OptionalPlayerMention}");

	registerAdminCommand(playerRemove, "player-remove", "players-remove");
	registerAdminCommandHelp("Admin", "Player", "player remove {@PlayerMention} {@OptionalPlayerMention}");
}
