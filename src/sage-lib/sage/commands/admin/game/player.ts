import type { Snowflake } from "discord.js";
import type SageMessage from "../../../model/SageMessage";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd";
import { registerAdminCommandHelp } from "../../help";

export async function gameUserList(sageMessage: SageMessage, who: string, userDids: Snowflake[] = []): Promise<void> {
	const denial = sageMessage.checkDenyAdminGame("List Game Users");
	if (denial) {
		return denial;
	}

	const game = sageMessage.game!;
	if (userDids.length) {
		const discord = await sageMessage.sageCache.discord.forGuild(game.serverDid);
		for (const userDid of userDids) {
			const guildMember = await discord?.fetchGuildMember(userDid);
			const title = guildMember ? `@${guildMember.user.tag}` : userDid;
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
	const denial = sageMessage.checkDenyAdminGame("Add Game Player");
	if (denial) {
		return denial;
	}

	const users = Array.from(sageMessage.message.mentions.users.values());
	const added = await sageMessage.game!.addPlayers(users.map(user => user.id));
	return sageMessage.reactSuccessOrFailure(added, "Game Player Added.", "Unknown Error; Game Player NOT Added!");
}

async function playerRemove(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyAdminGame("Remove Game Player");
	if (denial) {
		return denial;
	}

	const users = Array.from(sageMessage.message.mentions.users.values());
	const removed = await sageMessage.game!.removePlayers(users.map(user => user.id));
	return sageMessage.reactSuccessOrFailure(removed, "Game Player Removed.", "Unknown Error; Game Player NOT Removed!");
}

export default function register(): void {
	registerAdminCommand(playerList, "player-list", "players-list");
	registerAdminCommandHelp("Admin", "Player", "player list");

	registerAdminCommand(playerAdd, "player-add", "players-add");
	registerAdminCommandHelp("Admin", "Player", "player add {@PlayerMention} {@OptionalPlayerMention}");

	registerAdminCommand(playerRemove, "player-remove", "players-remove");
	registerAdminCommandHelp("Admin", "Player", "player remove {@PlayerMention} {@OptionalPlayerMention}");
}
