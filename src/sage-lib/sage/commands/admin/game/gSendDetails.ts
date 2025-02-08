import { getRollemId, getTupperBoxId } from "@rsc-sage/env";
import { DialogPostType, DiceOutputType, DicePostType, DiceSecretMethodType, DiceSortType, getCritMethodText } from "@rsc-sage/types";
import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import { getDateStrings } from "@rsc-utils/date-utils";
import { addZeroWidthSpaces, toHumanReadable } from "@rsc-utils/discord-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import type { TextChannel } from "discord.js";
import { getPermsFor } from "../../../../discord/permissions/getPermsFor.js";
import { getRequiredChannelPerms } from "../../../../discord/permissions/getRequiredChannelPerms.js";
import { type Game, GameRoleType, mapSageChannelNameTags, nameTagsToType } from "../../../model/Game.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { createAdminRenderableContent } from "../../cmd.js";
import { MoveDirectionOutputType } from "../../map/MoveDirection.js";
import { renderPostCurrency } from "../PostCurrency.js";

async function showGameGetGame(sageCommand: SageCommand): Promise<Game | null> {
	let game: Optional<Game> = sageCommand.game;
	if (!game) {
		const gameId = sageCommand.args.getIdType("id");
		if (gameId) {
			game = await sageCommand.sageCache.games.getById(gameId);
		}
		if (!game) {
			await sageCommand.replyStack.whisper("No Game Found!");
		}
	}
	if (!sageCommand.canAdminGames && !game?.hasGameMaster(sageCommand.authorDid)) {
		await sageCommand.replyStack.whisper("*Server Admin, Game Admin, or Game Master privilege required!*");
		return null;
	}
	return game ?? null;
}

function showGameRenderGameType(renderableContent: RenderableContent, game: Game): void {
	if (game.gameSystem) {
		renderableContent.append(`<b>Game System</b> ${game.gameSystem.name}`);
	}else if (game.server.gameSystem) {
		renderableContent.append(`<b>Game System</b> <i>inherited (${game.server.gameSystem.name})</i>`);
	}else {
		renderableContent.append(`<b>Game System</b> <i>inherited (None)</i>`);
	}
}

async function checkForMissingPerms(sageCommand: SageCommand, guildChannel?: TextChannel | null): Promise<string[]> {
	const bot = await sageCommand.discord.fetchGuildMember(sageCommand.bot.did);
	if (bot && guildChannel) {
		return getPermsFor(guildChannel, bot, ...getRequiredChannelPerms()).missing;
	}
	return [];
}

async function checkForOtherBots(guildChannel?: TextChannel | null): Promise<string[]> {
	const botNames: string[] = [];

	if (!guildChannel) {
		return botNames;
	}

	const bots = [["Tupperbox", getTupperBoxId()], ["Rollem", getRollemId()]];
	for (const [botName, botId] of bots) {
		const { canViewChannel } = getPermsFor(guildChannel, botId);
		if (canViewChannel) {
			botNames.push(botName);
		}
	}

	return botNames;
}

async function showGameRenderChannels(renderableContent: RenderableContent, sageCommand: SageCommand, game: Game): Promise<void> {
	renderableContent.append(`<b>Channels</b> ${game.channels.length}`);

	const tags = ["ic", "ooc", "dice", "gm", "misc"];
	for (const tag of tags) {
		const metas = game.channels
			.map(sageChannel => ({ sageChannel, nameTags:mapSageChannelNameTags(sageChannel) }))
			.filter(ch => ch.nameTags[tag as "ic"]);
		if (metas.length) {
			renderableContent.append(`[spacer]<b>${nameTagsToType(metas[0].nameTags)}</b>`);
			for (const meta of metas) {
				const guildChannel = await sageCommand.sageCache.fetchChannel<TextChannel>(meta.sageChannel.id);
				const guildChannelName = guildChannel ? `#${guildChannel.name}` : `<i>unavailable</i>`;

				const missingPerms = await checkForMissingPerms(sageCommand, guildChannel);
				const sageEmoji = missingPerms.length ? "[sage-missing-permissions]" : "";

				const otherBots = await checkForOtherBots(guildChannel);
				const otherBotsEmoji = otherBots.map(name => `[${name}]`).join("");

				renderableContent.append(`[spacer][spacer]${guildChannelName} ${sageEmoji}${otherBotsEmoji}`.trim());
			}
		}
	}
}

async function showGameRenderDialogType(renderableContent: RenderableContent, sageCommand: SageCommand, game: Game): Promise<void> {
	const labels = ["Embed", "Post"];
	const inheritedDialogType = game.dialogPostType ?? game.server.dialogPostType ?? DialogPostType.Embed;
	const dialogType = labels[game.dialogPostType!] ?? `<i>inherited (${labels[inheritedDialogType]})</i>`;
	renderableContent.append(`<b>Dialog Post Type</b> ${dialogType}`);

	// Check for users with .Post as their default
	if (inheritedDialogType !== DialogPostType.Post) {
		let showAlert = false;
		for (const gameUser of game.users) {
			const user = await sageCommand.sageCache.users.getByDid(gameUser.did);
			if (user?.dialogPostType === DialogPostType.Post) {
				showAlert = true;
				break;
			}
		}
		if (showAlert) {
			renderableContent.append(`[command-warn] <u>At least 1 user prefers Dialog via Post vs. Embed!</u> [command-warn]`);
		}
	}
}

function gameDetailsAppendDice(renderableContent: RenderableContent, game: Game): void {
	const server = game.server;
	renderableContent.append(`<b>Default Dice Options</b>`);

	const critMethodText = getCritMethodText(game.gameSystemType, game.diceCritMethodType, server.diceCritMethodType);
	renderableContent.append(`[spacer]<b>Crit Method</b> ${critMethodText}`);

	const diceOutputType: keyof typeof DiceOutputType | undefined = <keyof typeof DiceOutputType>DiceOutputType[game.diceOutputType!];
	const inheritedDiceOutputType = DiceOutputType[server.diceOutputType ?? DiceOutputType.M];
	renderableContent.append(`[spacer]<b>Output Format</b> ${diceOutputType ?? `<i>inherited (${inheritedDiceOutputType})</i>`}`);

	const dicePostType = DicePostType[game.dicePostType!];
	const inheritedDicePostType = DicePostType[server.dicePostType ?? DicePostType.SinglePost];
	renderableContent.append(`[spacer]<b>Post Style</b> ${dicePostType ?? `<i>inherited (${inheritedDicePostType})</i>`}`);

	const diceSecretMethodType: keyof typeof DiceSecretMethodType | undefined = <keyof typeof DiceSecretMethodType>DiceSecretMethodType[game.diceSecretMethodType!];
	const inheritedDiceSecretMethodType = DiceSecretMethodType[server.diceSecretMethodType ?? DiceSecretMethodType.Ignore];
	renderableContent.append(`[spacer]<b>Secret Checks</b> ${diceSecretMethodType ?? `<i>inherited (${inheritedDiceSecretMethodType})</i>`}`);

	const diceSortType: keyof typeof DiceSortType | undefined = <keyof typeof DiceSortType>DiceSortType[game.diceSortType!];
	const inheritedDiceSortType = DiceSortType[server.diceSortType ?? DiceSortType.None];
	renderableContent.append(`[spacer]<b>Sort Method</b> ${diceSortType ?? `<i>inherited (${inheritedDiceSortType})</i>`}`);

}

async function showGameRenderServer(renderableContent: RenderableContent, sageCommand: SageCommand, game: Game): Promise<void> {
	if (sageCommand.isSuperUser && game.serverDid !== sageCommand.server.did) {
		renderableContent.appendTitledSection("<b>Server</b>", game.serverDid, game.serverId);
		const guild = await sageCommand.discord.fetchGuild(game.serverDid);
		if (guild) {
			renderableContent.append(`<b>Name</b> ${guild.name}`);
			renderableContent.append(`<b>Available</b> ${guild.available}`);
		} else {
			renderableContent.append(`${"<i>NOT FOUND!</i>"}`);
		}
	}
}

async function createDetails(sageCommand: SageCommand, _game?: Game): Promise<RenderableContent | undefined> {
	const game = _game ?? await showGameGetGame(sageCommand);
	if (!game) {
		return undefined;
	}

	const renderableContent = createAdminRenderableContent(game);

	renderableContent.setTitle(`<b>${game.name}</b>`);
	renderableContent.append(game.id);

	renderableContent.append(`<b>Created</b> ${getDateStrings(game.createdDate).dateTime}`);
	if (game.archivedDate) {
		renderableContent.append(`[spacer]<b>Archived</b> ${getDateStrings(game.archivedDate).dateTime}`);
	}

	showGameRenderGameType(renderableContent, game);

	await showGameRenderChannels(renderableContent, sageCommand, game);

	const orphanChannels = await game.orphanChannels();
	if (orphanChannels.length) {
		const orphanChannelIds = orphanChannels.map(channel => `#${channel.id}`);
		renderableContent.append(`<b>Orphaned Channels</b> ${orphanChannelIds.length}; ${orphanChannelIds.join(", ")}`);
	}

	/** @todo fix the game / role interaction to actually work as expected. */
	const guildRoles = await game.guildRoles();
	if (guildRoles.length) {
		const roles = guildRoles.map(guildRole => guildRole ? `@${guildRole.name} (${GameRoleType[game.roles.find(role => role.did === guildRole.id)?.type!]})` : `<i>unavailable</i>`);
		renderableContent.append(`<b>Roles</b> ${roles.length}; ${roles.join(", ")}`);
	}

	const gmGuildMembers = await game.gmGuildMembers();
	const gameMasters = gmGuildMembers.map((gmGuildMember, index) => gmGuildMember ? toHumanReadable(gmGuildMember) : `<i>${game.gameMasters[index]}</i>`);
	renderableContent.append(`<b>GM Character Name</b>`, `[spacer]${addZeroWidthSpaces(game.gmCharacter.name)}`);
	renderableContent.append(`<b>Game Masters</b> ${gameMasters.length}`);
	gameMasters.forEach(gm => renderableContent.append(`[spacer]${gm}`));

	renderableContent.append(`<b>NonPlayer Characters</b> ${game.nonPlayerCharacters.length}`);

	const playerGuildMembers = await game.pGuildMembers();
	const players = playerGuildMembers.map(pGuildMember => {
		return {
			userId: pGuildMember.id as Snowflake,
			name: toHumanReadable(pGuildMember),
			characters: game.playerCharacters.filterByUser(pGuildMember.id as Snowflake).map(char => addZeroWidthSpaces(char.name)).join("; ")
		};
	});
	renderableContent.append(`<b>Players (Characters)</b> ${players.length}`);
	players.forEach(player => renderableContent.append(`[spacer]${player.name}${player.characters ? ` (${player.characters})` : ``}`));

	const orphanUsers = await game.orphanUsers();
	if (orphanUsers.length) {
		const orphanUserIds = orphanUsers.map(user => `@${user.did}`);
		renderableContent.append(`<b>Orphaned Users</b> ${orphanUserIds.length}; ${orphanUserIds.join(", ")}`);
	}

	const orphanPCs = game.orphanedPlayerCharacters;
	if (orphanPCs.length) {
		renderableContent.append(`<b>Orphaned Player Characters</b> ${orphanPCs.length}`);
		orphanPCs.forEach(pc => renderableContent.append(`[spacer]${addZeroWidthSpaces(pc.name)}`));
	}

	await showGameRenderDialogType(renderableContent, sageCommand, game);

	gameDetailsAppendDice(renderableContent, game);

	const moveDirectionOutputType = MoveDirectionOutputType[game.moveDirectionOutputType!] ?? `<i>unset (Compact)</i>`;
	renderableContent.append(`<b>Move Direction Output Type</b> ${moveDirectionOutputType}`);

	await showGameRenderServer(renderableContent, sageCommand, game);

	renderPostCurrency(game, renderableContent, players);

	return renderableContent;
}

export async function gSendDetails(sageCommand: SageCommand, game?: Game): Promise<void> {
	const renderableContent = await createDetails(sageCommand, game);
	if (renderableContent) {
		await sageCommand.replyStack.send({ embeds:renderableContent });
	}
}

// export async function gReplyDetails(sageCommand: SageCommand, game?: Game): Promise<void> {
// 	const renderableContent = await createDetails(sageCommand, game);
// 	if (renderableContent) {
// 		await sageCommand.reply(renderableContent, true);
// 		await sageCommand.noDefer();
// 	}
// }