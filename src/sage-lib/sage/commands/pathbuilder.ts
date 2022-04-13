import * as Discord from "discord.js";
import { PathbuilderCharacter } from "../../../sage-pf2e";
import type { Optional } from "../../../sage-utils";
import utils from "../../../sage-utils";
import type { DUser, TChannel, TCommand } from "../../discord";
import { isAuthorBotOrWebhook, registerInteractionListener, registerReactionListener } from "../../discord/handlers";
import { SageDialogWebhookName } from "../../discord/messages";
import { discordPromptYesNo } from "../../discord/prompts";
import ActiveBot from "../model/ActiveBot";
import type SageMessage from "../model/SageMessage";
import type SageReaction from "../model/SageReaction";
import { registerAdminCommand } from "./cmd";
import { resolveToEmbeds } from "../../discord/embeds";
import type { TPathbuilderCharacterCustomFlags } from "../../../sage-pf2e/model/pc/PathbuilderCharacter";
import type SageInteraction from "../model/SageInteraction";
import type { TSlashCommand } from "../../../types";
import type SageCache from "../model/SageCache";
import { registerSlashCommand } from "../../../slash.mjs";

/** THIS IS COPY/PASTED; PROPERLY REUSE IT */
function updateEmbed(originalEmbed: Discord.MessageEmbed, title: Optional<string>, imageUrl: Optional<string>, content: string): Discord.MessageEmbed {
	const updatedEmbed = new Discord.MessageEmbed();
	updatedEmbed.setTitle(title ?? originalEmbed.title ?? "");
	updatedEmbed.setDescription(content);
	updatedEmbed.setThumbnail(imageUrl ?? originalEmbed.thumbnail?.url ?? "");
	updatedEmbed.setColor(originalEmbed.color!);
	return updatedEmbed;
}

async function pathbuilder2e(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowAdmin) {
		return sageMessage.reactBlock();
	}

	// const showAction = sageMessage.args.find(arg => arg.toLowerCase() === "show");
	const pinAction = !!sageMessage.args.find(arg => arg.toLowerCase() === "pin");

	const idArg = sageMessage.args.find(arg => arg.match(/^id=\d+$/i));
	if (!idArg) {
		return sageMessage.reactWarn();
	}

	const pathbuilderId = +idArg.split("=")[1];
	const flags: TPathbuilderCharacterCustomFlags = { };
	if (false) {
		flags._proficiencyWithoutLevel = true;
		flags._untrainedPenalty = true;
	}
	const pathbuilderChar = await PathbuilderCharacter.fetch(pathbuilderId, flags);
	if (!pathbuilderChar) {
		console.log(`Failed to fetch Pathbuilder character ${pathbuilderId}!`);
		return sageMessage.reactWarn();
	}

	if (sageMessage.args.includes("attach")) {
		return attachCharacter(sageMessage.caches, sageMessage.message.channel as TChannel, pathbuilderId, pathbuilderChar, pinAction);
	}

	const messages = await sageMessage.send(`*Pathbuilder2e:${pathbuilderId}*\n` + pathbuilderChar.toHtml());
	if (pinAction && messages[0]?.pinnable) {
		await messages[0].pin();
	}

	if (sageMessage.playerCharacter?.name === pathbuilderChar.name) {
		const bool = await discordPromptYesNo(sageMessage, `Update ${pathbuilderChar.name}?`);
		if (bool === true) {
			const updated = await sageMessage.playerCharacter.update({ pathbuilder:pathbuilderChar.toJSON() });
			await sageMessage.reactSuccessOrFailure(updated);
		}
	}else if (sageMessage.isPlayer) {
		if (sageMessage.playerCharacter) {
			const bool = await discordPromptYesNo(sageMessage, `Replace ${sageMessage.playerCharacter.name} with ${pathbuilderChar.name}?`);
			if (bool === true) {
				const replaced = await sageMessage.playerCharacter.update({ pathbuilder:pathbuilderChar.toJSON() });
				await sageMessage.reactSuccessOrFailure(replaced);
			}
		}else {
			const bool = await discordPromptYesNo(sageMessage, `Import ${pathbuilderChar.name}?`);
			if (bool === true) {
				const added = await sageMessage.game?.playerCharacters.addCharacter({
					id: utils.UuidUtils.generate(),
					pathbuilder: pathbuilderChar.toJSON(),
					name: pathbuilderChar.name,
					userDid: sageMessage.sageUser.did
				});
				await sageMessage.reactSuccessOrFailure(added !== null);
			}
		}
	}
}

async function attachCharacter(sageCache: SageCache, channel: TChannel | DUser, pathbuilderId: number, pathbuilderChar: PathbuilderCharacter, pin: boolean): Promise<void> {
	const raw = resolveToEmbeds(sageCache, pathbuilderChar.toHtml()).map(e => e.description).join("");
	const buffer = Buffer.from(raw, "utf-8");
	const attachment = new Discord.MessageAttachment(buffer, `pathbuilder2e-${pathbuilderId}.txt`);
	const message = await channel.send({
		content: `Attaching Pathbuilder2e Character: ${pathbuilderChar.name} (${pathbuilderId})`,
		files:[attachment]
	}).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
	if (pin && message?.pinnable) {
		await message.pin();
	}
	return Promise.resolve();
}

//#region refresh

async function isPathbuilder2eRefresh(sageReaction: SageReaction): Promise<TCommand | null> {
	const isBot = await isAuthorBotOrWebhook(sageReaction);
	if (!isBot) {
		return null;
	}

	const messageReaction = sageReaction.messageReaction;

	// const game = botTesterReaction.sageCache.game;
	// const server = botTesterReaction.sageCache.server;
	// const bot = botTesterReaction.sageCache.bot;
	const refreshEmoji = "♻️"; // (game ?? server ?? bot).getEmoji(EmojiType.CommandDelete);
	if (messageReaction.emoji.name !== refreshEmoji) {
		return null;
	}

	const message = messageReaction.message;
	const embed = message.embeds[0];
	if (!embed) {
		return null;
	}

	return embed.description?.match(/^\*Pathbuilder2e:\d+\*\n/)
		? { command: "pathbuilder-refresh" }
		: null;
}

async function doPathbuilder2eRefresh(sageReaction: SageReaction): Promise<void> {
	const message = sageReaction.messageReaction.message;
	const embed = message.embeds[0];
	const pathbuilderId = +(embed.description?.match(/^\*Pathbuilder2e:(\d+)\*\n/) ?? [])[1];
	const pathbuilderChar = await PathbuilderCharacter.fetch(pathbuilderId);

	const caches = sageReaction.caches;
	const formattedCharacter = caches.format(`*Pathbuilder2e:${pathbuilderId}*\n` + pathbuilderChar?.toHtml());
	const updatedEmbed = updateEmbed(embed, null, null, formattedCharacter);
	if (ActiveBot.isActiveBot(message.author?.id)) {
		message.edit({ embeds:[updatedEmbed] }).then(() => sageReaction.messageReaction.remove(), console.error);
	} else {
		const webhook = await caches.discord.fetchWebhook(caches.server.did, caches.discordKey.channel, SageDialogWebhookName);
		webhook?.editMessage(<Discord.Message>message, { embeds:[updatedEmbed] }).then(() => sageReaction.messageReaction.remove(), console.error);
	}

}

//#endregion

//#region slash command
//118142
function slashTester(sageInteraction: SageInteraction): boolean {
	return sageInteraction.isCommand("Pathbuilder2e");
}

async function slashHandler(sageInteraction: SageInteraction): Promise<void> {
	const pathbuilderId = +(sageInteraction.getString("id") ?? "");
	await sageInteraction.reply(`Fetching Pathbuilder 2e character using 'Export JSON' id: ${pathbuilderId}`, true);

	const pathbuilderChar = await PathbuilderCharacter.fetch(pathbuilderId, { });
	if (!pathbuilderChar) {
		return sageInteraction.reply(`Failed to fetch Pathbuilder 2e character using 'Export JSON' id: ${pathbuilderId}!`, true);
	}

	const channel = sageInteraction.interaction.channel as TChannel ?? sageInteraction.user;

	const pin = sageInteraction.getBoolean("pin") ?? false;
	const attach = sageInteraction.getBoolean("attach") ?? false;
	if (attach) {
		await attachCharacter(sageInteraction.caches, channel, pathbuilderId, pathbuilderChar, pin);
	}else {
		const messages = await sageInteraction.send(`*Pathbuilder2e:${pathbuilderId}*\n` + pathbuilderChar.toHtml());
		if (pin && messages[0]?.pinnable) {
			await messages[0].pin();
		}
	}
	return sageInteraction.deleteReply();
}

function pathbuilder2eCommand(): TSlashCommand {
	return {
		name: "Pathbuilder2e",
		description: "Import a character from Pathbuilder 2e",
		options: [
			{ name:"id", description:"The 'Pathbuilder 2e JSON ID' when you Export JSON", isRequired:true },
			{ name:"attach", description:"Attach the character as a Markdown formatted text document.", isBoolean:true },
			{ name:"pin", description:"Pin this character in the channel.", isBoolean:true }
		]
	};
}


//#endregion

export function registerCommandHandlers(): void {
	registerAdminCommand(pathbuilder2e, "pathbuilder2e");
	if (false) registerReactionListener(isPathbuilder2eRefresh, doPathbuilder2eRefresh);
	registerInteractionListener(slashTester, slashHandler);
}

export function registerSlashCommands(): void {
	registerSlashCommand(pathbuilder2eCommand());
}
