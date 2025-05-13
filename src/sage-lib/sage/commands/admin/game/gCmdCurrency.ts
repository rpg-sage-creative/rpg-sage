import { addCommas, isDefined, type Snowflake } from "@rsc-utils/core-utils";
import { splitMessageOptions, toChannelUrl, toDiscordDate, toHumanReadable } from "@rsc-utils/discord-utils";
import { capitalize } from "@rsc-utils/string-utils";
import { registerListeners } from "../../../../discord/handlers/registerListeners.js";
import { discordPromptYesNo } from "../../../../discord/prompts.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { createAdminRenderableContent } from "../../cmd.js";
import { addPostCurrencyEvent, removePostCurrency, renderPostCurrency, togglePostCurrency } from "../PostCurrency.js";

async function gCmdAddCurrency(sageCommand: SageCommand): Promise<void> {
	sageCommand.replyStack.startThinking();

	if (!sageCommand.game) {
		return sageCommand.replyStack.whisper("There is no Game!");
	}

	if (!sageCommand.canAdminGame) {
		return sageCommand.replyStack.whisper("Sorry, you aren't allowed to manage this Game.");
	}

	const key = sageCommand.args.getString("key");
	const dialogIncrement = sageCommand.args.getNumber("dialogIncrement") ?? sageCommand.args.getNumber("increment") ?? undefined;
	const diceIncrement = sageCommand.args.getNumber("diceIncrement") ?? undefined;
	if (!key || !(isDefined(dialogIncrement) || isDefined(diceIncrement))) {
		return sageCommand.replyStack.whisper(`Your command must include key="" and either dialogIncrement="" or diceIncrement="".`);
	}

	const name = sageCommand.args.getString("name");
	const description = sageCommand.args.getString("description") ?? sageCommand.args.getString("desc");
	const resetCounts = sageCommand.args.getBoolean("resetCounts") ?? false;
	const recalculateTotals = sageCommand.args.getBoolean("recalculateTotals") ?? false;

	addPostCurrencyEvent(sageCommand.game, { key, name, description, dialogIncrement, diceIncrement, resetCounts, recalculateTotals });

	sageCommand.replyStack.stopThinking();

	await _gCmdShowCurrency(sageCommand);

	const displayName = name ?? key;

	const save = await discordPromptYesNo(sageCommand, `Save Post Currency "${displayName}"?`, true);
	if (save) {
		const saved = await sageCommand.game.save();
		if (saved) {
			await sageCommand.replyStack.editLast(`Post Currency "${displayName}" Saved.`);

		}else {
			await sageCommand.replyStack.whisper(`Unknown Error; Post Currency "${displayName}" NOT Saved!`);

		}
	}else {
		await sageCommand.replyStack.editLast(`Post Currency "${displayName}" ***NOT*** Saved.`);

	}
}

async function gCmdRemoveCurrency(sageCommand: SageCommand): Promise<void> {
	sageCommand.replyStack.startThinking();

	if (!sageCommand.game) {
		return sageCommand.replyStack.whisper("There is no Game!");
	}

	if (!sageCommand.canAdminGame) {
		return sageCommand.replyStack.whisper("Sorry, you aren't allowed to manage this Game.");
	}

	const key = sageCommand.args.getString("key");
	if (!key) {
		return sageCommand.replyStack.whisper(`Your command must include key="".`);
	}

	const currency = sageCommand.game.postCurrency[key];
	if (!currency) {
		return sageCommand.replyStack.whisper(`Post Currency "${key}" not found!`);
	}

	sageCommand.replyStack.stopThinking();

	await _gCmdShowCurrency(sageCommand);

	const displayName = currency.name ?? currency.key;

	const save = await discordPromptYesNo(sageCommand, `Remove Post Currency: ${displayName}?\n> *NOTE: Post counts and totals will be lost. This cannot be undone!*`, true);
	if (save) {
		removePostCurrency(sageCommand.game, { key });
		const saved = await sageCommand.game.save();
		if (saved) {
			await sageCommand.replyStack.editLast(`Post Currency "${displayName}" removed.`);

		}else {
			await sageCommand.replyStack.whisper(`Unknown Error; Post Currency "${displayName}" NOT removed!`);

		}
	}else {
		await sageCommand.replyStack.editLast(`Post Currency "${displayName}" ***NOT*** removed.`);

	}
}
async function gCmdToggleCurrency(sageCommand: SageCommand): Promise<void> {
	sageCommand.replyStack.startThinking();

	if (!sageCommand.game) {
		return sageCommand.replyStack.whisper("There is no Game!");
	}

	if (!sageCommand.canAdminGame) {
		return sageCommand.replyStack.whisper("Sorry, you aren't allowed to manage this Game.");
	}

	const key = sageCommand.args.getString("key");
	if (!key) {
		return sageCommand.replyStack.whisper(`Your command must include key="".`);
	}

	const currency = sageCommand.game.postCurrency[key];
	if (!currency) {
		return sageCommand.replyStack.whisper(`Post Currency "${key}" not found!`);
	}

	togglePostCurrency(sageCommand.game, { key });

	sageCommand.replyStack.stopThinking();

	await _gCmdShowCurrency(sageCommand);

	const displayName = currency.name ?? currency.key;
	const label = currency.disabled ? "Disable" : "Enable";
	const labeld = currency.disabled ? "disabled" : "enabled";
	const note = currency.disabled ? `\n> *NOTE: Post counts are not tracked at all while disabled.*` : ``;

	const save = await discordPromptYesNo(sageCommand, `${label} Post Currency: ${displayName}?${note}`, true);
	if (save) {
		const saved = await sageCommand.game.save();
		if (saved) {
			await sageCommand.replyStack.editLast(`Post Currency "${displayName}" ${labeld}.`);

		}else {
			await sageCommand.replyStack.whisper(`Unknown Error; Post Currency "${displayName}" NOT ${labeld}!`);

		}
	}else {
		await sageCommand.replyStack.editLast(`Post Currency "${displayName}" ***NOT*** ${labeld}.`);

	}
}

async function gCmdShowCurrency(sageCommand: SageCommand): Promise<void> {
	sageCommand.replyStack.startThinking();

	if (!sageCommand.game) {
		return sageCommand.replyStack.whisper("There is no Game!");
	}

	await _gCmdShowCurrency(sageCommand);

	sageCommand.replyStack.stopThinking();
}

async function _gCmdShowCurrency(sageCommand: SageCommand): Promise<void> {
	const game = sageCommand.game!;

	const renderableContent = createAdminRenderableContent(game);

	const playerGuildMembers = await game.pGuildMembers();
	const players = playerGuildMembers.map(pGuildMember => {
		return {
			userId: pGuildMember.id as Snowflake,
			name: toHumanReadable(pGuildMember)
		};
	});
	renderPostCurrency(game, renderableContent, players);

	await sageCommand.replyStack.send({ embeds:renderableContent });
}

async function gCmdAuditCurrency(sageCommand: SageCommand): Promise<void> {
	sageCommand.replyStack.startThinking();

	if (!sageCommand.game) {
		return sageCommand.replyStack.whisper("There is no Game!");
	}

	if (!sageCommand.canAdminGame) {
		return sageCommand.replyStack.whisper("Sorry, you aren't allowed to manage this Game.");
	}

	const { postCurrency } = sageCommand.game;
	const postCurrencyData = Object.values(postCurrency);

	if (!postCurrencyData.length) {
		return sageCommand.replyStack.whisper("There are no Post Currencies for this Game.");
	}

	const user = sageCommand.args.getUser("user");
	const userId = user?.id;
	if (!userId) {
		return sageCommand.replyStack.whisper(`Your command must include user="".`);
	}

	const readableUser = toHumanReadable(user);
	const isValidUser = sageCommand.game.hasPlayer(userId) || postCurrencyData.some(data => data.totals.some(total => total.userId === userId));
	if (!isValidUser) {
		return sageCommand.replyStack.whisper(`The given user (${readableUser}) has no currency.`);
	}

	const guildId = sageCommand.server?.did;

	const renderableContent = createAdminRenderableContent(sageCommand.game);
	renderableContent.append(`<h2>Post Currency Audit</h2>`);
	renderableContent.append(`<b>User:</b> ${readableUser}`);
	renderableContent.append(`- ${userId}`);
	renderableContent.append(`<b>Game:</b> ${sageCommand.game.name ?? sageCommand.game.id}`);
	if (sageCommand.game.name) {
		renderableContent.append(`- ${sageCommand.game.id}`);
	}
	postCurrencyData.forEach(data => {
		let totalValue = 0;
		const lines: string[] = [];
		data.events.forEach(({ beginTs, endTs, increments, userCounts }) => {
			lines.push(`${toDiscordDate(beginTs, "d")} - ${endTs ? toDiscordDate(endTs, "d") : "*current*"}`);
			increments.forEach(({ channelId, increment, postType }) => {
				lines.push(`> Increment: ${channelId ? toChannelUrl({ guildId, channelId, messageId:undefined }) : ""} ${addCommas(increment)} ${postType} posts`);
				const filteredUserCounts = userCounts.filter(uc => uc.userId === userId && (!channelId || channelId === uc.channelId) && (postType === "all" || postType === uc.postType));
				let total = 0;
				filteredUserCounts.forEach(({ channelId, count, postType }) => {
					total += count;
					lines.push(`> - ${capitalize(postType)} Posts: ${addCommas(count)} in ${toChannelUrl({ guildId, channelId, messageId:undefined })}`);
				});
				const value = increment ? Math.floor(total / increment) : 0;
				lines.push(`> Total ${capitalize(postType)} Posts: ${addCommas(total)} for ${addCommas(value)} ${data.name ?? data.key}`);
				totalValue += value;
			});
		});
		renderableContent.append(`\n<b>Currency: ${data.name ?? data.key} (${addCommas(totalValue)})</b>`);
		if (data.description) {
			renderableContent.append(data.description);
		}
		renderableContent.append(...lines);
	});

	const gmUser = await sageCommand.discord.fetchUser(sageCommand.actorId);
	if (gmUser) {
		const sendArgs = sageCommand.resolveToOptions(renderableContent);
		const payloads = splitMessageOptions(sendArgs);
		for (const payload of payloads) {
			await gmUser.send(payload);
		}
	}else {
		await sageCommand.replyStack.whisper("Sorry, we can't DM you!");
	}

	sageCommand.replyStack.stopThinking();
}

export function registerPostCurrency(): void {
	registerListeners({ commands:["currency|add"], message:gCmdAddCurrency });
	registerListeners({ commands:["currency|remove"], message:gCmdRemoveCurrency });
	registerListeners({ commands:["currency|details"], message:gCmdShowCurrency });
	registerListeners({ commands:["currency|toggle"], message:gCmdToggleCurrency });
	registerListeners({ commands:["currency|audit"], message:gCmdAuditCurrency });
}