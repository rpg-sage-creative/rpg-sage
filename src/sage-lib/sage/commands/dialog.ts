import * as Discord from "discord.js";
import type { TDiceOutput } from "../../../sage-dice";
import utils, { OrUndefined, TParsers, type Optional } from "../../../sage-utils";
import * as _XRegExp from "xregexp";
import { NilSnowflake, TCommand, TCommandAndArgsAndData } from "../../discord";
import { DiscordId, DiscordKey, MessageType, ReactionType } from "../../discord";
import { isAuthorBotOrWebhook, registerMessageListener, registerReactionListener } from "../../discord/handlers";
import { replace, replaceWebhook, SageDialogWebhookName, send, sendWebhook } from "../../discord/messages";
import ActiveBot from "../model/ActiveBot";
import type CharacterManager from "../model/CharacterManager";
import GameCharacter, { type GameCharacterCore, type TDialogMessage } from "../model/GameCharacter";
import { ColorType } from "../model/HasColorsCore";
import { EmojiType } from "../model/HasEmojiCore";
import type SageMessage from "../model/SageMessage";
import type SageReaction from "../model/SageReaction";
import DialogMessageRepository from "../repo/DialogMessageRepository";
import { parseDiceMatches, sendDice } from "./dice";
import { registerInlineHelp } from "./help";
const XRegExp: typeof _XRegExp = (_XRegExp as any).default;


//#region Dialog Post

type TDialogPostData = {
	authorName?: string;
	character: GameCharacter;
	colorType?: ColorType;
	content: string;
	embedColor?: string;
	imageUrl?: string;
	title?: string;
};

//TODO: sort out why i am casting caches to <any>
async function sendDialogRenderable(sageMessage: SageMessage, renderableContent: utils.RenderUtils.RenderableContent, authorOptions: Discord.WebhookMessageOptions): Promise<Discord.Message[]> {
	const targetChannel = await sageMessage.discord.fetchChannel(sageMessage.channel?.sendDialogTo);
	if (targetChannel) {
		const sent = sageMessage.dialogType === "Webhook"
			? await sendWebhook(sageMessage.caches, targetChannel, renderableContent, authorOptions).catch(utils.ConsoleUtils.Catchers.errorReturnEmptyArray)
			: await send(sageMessage.caches, targetChannel, renderableContent, sageMessage.message.author).catch(utils.ConsoleUtils.Catchers.errorReturnEmptyArray);
		if (sent.length) {
			// sageMessage._.set("Dialog", sent[sent.length - 1]);
			// if (sageMessage.message.deletable) {
			// 	sageMessage.message.delete();
			// }
		}
		return sent;
	} else {
		const replaced = sageMessage.dialogType === "Webhook"
			? await replaceWebhook(sageMessage.caches, sageMessage.message, renderableContent, authorOptions).catch(utils.ConsoleUtils.Catchers.errorReturnEmptyArray)
			: await replace(sageMessage.caches, sageMessage.message, renderableContent).catch(utils.ConsoleUtils.Catchers.errorReturnEmptyArray);
		if (replaced.length) {
			// sageMessage._.set("Dialog", replaced[replaced.length - 1]);
			// if (sageMessage._.has("Dice")) {
			// 	await sageMessage.reactDie();
			// }
		}
		return replaced;
	}
}

async function sendDialogPost(sageMessage: SageMessage, postData: TDialogPostData): Promise<Discord.Message[]> {
	const character = postData?.character;
	if (!character) {
		return Promise.reject("Invalid TDialogPostData");
	}

	const webhook = sageMessage.dialogType === "Webhook";
	const renderableContent = new utils.RenderUtils.RenderableContent();

	const authorName = postData.authorName || character.name;
	const title = postData.title || authorName;
	if (!webhook || title !== authorName) {
		renderableContent.setTitle(title);
	}

	const color = postData.embedColor ?? character.embedColor ?? sageMessage.toDiscordColor(postData.colorType);
	renderableContent.setColor(color);

	let content = postData.content;
	//#region dice lists
	const diceMatches = parseDiceMatches(sageMessage, content);
	const inlineDiceMatches = diceMatches.filter(match => match.inline);
	const otherDiceMatches = diceMatches.filter(match => !match.inline);
	//#endregion
	//#region inline dice
	if (inlineDiceMatches.length > 0) {
		inlineDiceMatches.reverse(); // gotta do em in reverse order to preserve indexes
		for (const diceMatch of inlineDiceMatches) {
			const left = content.slice(0, diceMatch.index);
			const middle = diceMatch.output.map(out => out.hasSecret ? `${out.input} [die]` : out.inlineOutput).join("");
			const right = content.slice(diceMatch.index + diceMatch.match.length);
			content = left + middle + right;
		}
	}
	//#endregion
	renderableContent.append(content);

	const thumbnailUrl = postData.imageUrl ?? character.avatarUrl;
	renderableContent.setThumbnailUrl(thumbnailUrl);

	// Discord "avatarURL" is the profile pic, which I am calling the "tokenUrl"
	const avatarUrl = character.tokenUrl ?? sageMessage.bot.tokenUrl;

	const messages: Discord.Message[] = await sendDialogRenderable(sageMessage, renderableContent, { username: authorName, avatarURL: avatarUrl })
		.catch(utils.ConsoleUtils.Catchers.errorReturnEmptyArray);
	if (messages.length) {
		//#region dice
		const diceOutputs = otherDiceMatches.reduce((out, match) => { out.push(...match.output); return out }, <TDiceOutput[]>[]);
		if (diceOutputs.length) {
			await sendDice(sageMessage, diceOutputs);
		}
		//#endregion
		const last = messages[messages.length - 1];

		const dialogMessage: Partial<TDialogMessage> = {
			channelDid: last.channel.isThread() ? last.channel.parent?.id : last.channel.id,
			characterId: character.id,
			gameId: sageMessage.game?.id,
			messageDid: last.id,
			serverDid: last.guild?.id,
			threadDid: last.channel.isThread() ? last.channel.id : undefined,
			timestamp: last.createdTimestamp,
			userDid: character.userDid
		};
		await DialogMessageRepository.write(DiscordKey.fromMessage(last), dialogMessage as TDialogMessage);

		character.setLastMessage(dialogMessage as TDialogMessage);
		await character.save();
	}
	return messages;
}

//#endregion

//#region Helpers

function findPc(sageMessage: SageMessage, pcNameOrIndex: Optional<string>): GameCharacter | undefined {
	if (sageMessage.game) {
		return sageMessage.playerCharacter;
	} else if (!sageMessage.channel || sageMessage.channel.dialog) {
		if (utils.StringUtils.isBlank(pcNameOrIndex)) {
			return sageMessage.user.playerCharacters.first();
		}
		return sageMessage.user.playerCharacters.findByNameOrIndex(pcNameOrIndex);
	}
	return undefined;
}

function findCompanion(sageMessage: SageMessage, companionNameOrIndex: Optional<string>): GameCharacter | undefined {
	let companions: CharacterManager | undefined;
	if (sageMessage.gameChannel) {
		companions = sageMessage.playerCharacter?.companions;
	} else if (!sageMessage.channel || sageMessage.channel.dialog) {
		// Currently only allow a single PC per server outside of games
		companions = sageMessage.user.playerCharacters.first()?.companions;
	}
	if (companions) {
		if (utils.StringUtils.isBlank(companionNameOrIndex)) {
			return companions.first();
		}
		return companions.findByNameOrIndex(companionNameOrIndex);
	}
	return undefined;
}

function findNpc(sageMessage: SageMessage, npcName: string): GameCharacter | undefined {
	if (sageMessage.gameChannel) {
		return sageMessage.isGameMaster ? sageMessage.game!.nonPlayerCharacters.findByName(npcName) : undefined;
	} else if (!sageMessage.channel || sageMessage.channel.dialog) {
		return sageMessage.user.nonPlayerCharacters.findByName(npcName);
	}
	return undefined;
}

/** Finds the Game Master NPC, using the saved name or the default name, creating one if not found and the user is a GameMaster. */
async function findGm(sageMessage: SageMessage): Promise<GameCharacter | undefined> {
	if (sageMessage.game) {
		if (sageMessage.isGameMaster) {
			const gmCharacterName = sageMessage.game.gmCharacterName ?? GameCharacter.defaultGmCharacterName;
			const gm = findNpc(sageMessage, gmCharacterName);
			if (gm) {
				return gm;
			}
			const added = await sageMessage.game.nonPlayerCharacters.addCharacter(<GameCharacterCore>{ name: gmCharacterName });
			return added ?? undefined;
		}
		return undefined;
	}
	const defaultGmCharacterName = sageMessage.server?.defaultGmCharacterName ?? GameCharacter.defaultGmCharacterName;
	return new GameCharacter(<GameCharacterCore>{ name: defaultGmCharacterName });
}

//#endregion

//#region Dialog Color

type TNpcType = "ally" | "enemy" | "npc";
type TCompanionType = "alt" | "companion" | "hireling";
type TDialogType = "edit" | "gm" | TNpcType | "pc" | TCompanionType;

function getColorType(dialogType: TDialogType): ColorType | null {
	switch (dialogType) {
		case "gm": return ColorType.GameMaster;

		case "npc": return ColorType.NonPlayerCharacter;
		case "ally": return ColorType.NonPlayerCharacterAlly;
		case "enemy": return ColorType.NonPlayerCharacterEnemy;

		case "pc": return ColorType.PlayerCharacter;

		case "alt": return ColorType.PlayerCharacter;
		case "hireling": return ColorType.PlayerCharacterHireling;
		case "companion": return ColorType.PlayerCharacterCompanion;
	}
	return null;
}

//#endregion

//#region Dialog Parser

export type TDialogContent = {
	type: TDialogType;
	name?: string;
	displayName?: string;
	title?: string;
	imageUrl?: string;
	embedColor?: string;
	content: string;
};

type TTypeRegexAndSeparatorParts = {
	type: string;
	separator: string;
};

const colonSeparatorPart = `(:)`;
const dialogTypePart = `(edit|gm|npc|enemy|ally|pc|alt|companion|hireling)`;
const dialogSeparatorPart = `([^\\w\\s])`;
const dynamicTypePart = `([\\pL\\pN]+)`;
const dynamicSeparatorPart = `([^\\pL\\pN\\s])`;

/** Returns escaped separator regex pattern. */
function matchDialogSeparator(content: string, typePart: string, separatorPart: string): string | null {
	const separatorRegex = XRegExp(`^${typePart}${separatorPart}`, "i"),
		typeSeparatorMatch = separatorRegex.exec(content);
	if (typeSeparatorMatch) {
		const escapedSeparator = XRegExp.escape(typeSeparatorMatch[2]),
			separatorLengthRegex = XRegExp(`^${typePart}(${escapedSeparator}+)`, "i"),
			separatorLengthMatch = separatorLengthRegex.exec(content)!,
			separatorLength = separatorLengthMatch[2].length;
		return `${escapedSeparator}{${separatorLength}}`;
	}
	return null;
}
function getDialogSeparator(content: string, allowDynamicDialogSeparator: boolean): TTypeRegexAndSeparatorParts | null {
	let separator: string | null;

	// Test traditional dialog and :: separator
	separator = matchDialogSeparator(content, dialogTypePart, colonSeparatorPart);
	if (separator) {
		return { type: dialogTypePart, separator: separator };
	}

	// Test aliased dialog and :: separator
	separator = matchDialogSeparator(content, dynamicTypePart, colonSeparatorPart);
	if (separator) {
		return { type: dynamicTypePart, separator: separator };
	}

	if (allowDynamicDialogSeparator) {

		// Test traditional dialog and variable separator
		separator = matchDialogSeparator(content, dialogTypePart, dialogSeparatorPart);
		if (separator) {
			return { type: dialogTypePart, separator: separator };
		}

		// Test aliased dialog and variable separator
		separator = matchDialogSeparator(content, dynamicTypePart, dynamicSeparatorPart);
		if (separator) {
			return { type: dynamicTypePart, separator: separator };
		}

	}

	return null;
}

/** Generates parsers for the given separator. */
function getDialogParsers(typeAndSeparator: TTypeRegexAndSeparatorParts): TParsers {
	return {
		type: XRegExp(`^${typeAndSeparator.type}${typeAndSeparator.separator}`, "i"),
		color: XRegExp(`(?:0x|#)([0-9a-f]{3}|[0-9a-f]{6})${typeAndSeparator.separator}`, "i"),
		image: XRegExp(`((?:https?:\\/\\/.*?)|(?:<https?:\\/\\/.*?>))${typeAndSeparator.separator}`, "i"),
		names: XRegExp(`([^\(]+)(?!${typeAndSeparator.separator})\\(([^\\)]+)\\)${typeAndSeparator.separator}`),
		title: XRegExp(`\\(([^\\)]+)\\)${typeAndSeparator.separator}`),
		part: XRegExp(`(.*?)${typeAndSeparator.separator}`)
	};
}

function cleanUrl(url: Optional<string>): OrUndefined<string> {
	if (url) {
		if (url.startsWith("<") && url.endsWith(">")) {
			return url.slice(1, -1);
		}
		return url;
	}
	return undefined;
}

/** Uses tokens to parse the dialog content. */
export function parseDialogContent(content: string, allowDynamicDialogSeparator: boolean): TDialogContent | null {
	const typeAndSeparator = getDialogSeparator(content, allowDynamicDialogSeparator);
	if (typeAndSeparator) {
		const parsers = getDialogParsers(typeAndSeparator),
			tokens = utils.StringUtils.Tokenizer.tokenize(content, parsers, "content"),
			nameTokens = tokens.filter(token => token.type === "names"),
			titleTokens = tokens.filter(token => token.type === "title"),
			partTokens = tokens.filter(token => token.type === "part");

		const typeToken = tokens.find(token => token.type === "type")!,
			nameToken = nameTokens.shift() ?? (titleTokens.length > 1 ? titleTokens.shift() : null) ?? partTokens.shift(),
			titleToken = titleTokens.find(token => token !== nameToken),
			imageToken = tokens.find(token => token.type === "image"),
			colorToken = tokens.find(token => token.type === "color"),
			usedTokens = [typeToken, nameToken, titleToken, imageToken, colorToken],
			otherTokens = tokens.filter(token => !usedTokens.includes(token));

		return {
			type: <TDialogType>typeToken.matches[0].toLowerCase(),
			name: nameToken?.matches[0],
			displayName: nameToken?.matches[nameToken?.type === "title" ? 0 : 1],
			title: titleToken?.matches[0],
			imageUrl: cleanUrl(imageToken?.matches[0]),
			embedColor: colorToken?.matches[0],
			content: otherTokens.map(token => token.token).join("")
		};
	}
	return null;
}

export function parseOrAutoDialogContent(sageMessage: SageMessage): TDialogContent | null {
	const content = sageMessage.message.content ?? ""; //TODO: was message.edits[0].content
	const dialogContent = parseDialogContent(content, sageMessage.user?.allowDynamicDialogSeparator);
	if (dialogContent) {
		return dialogContent;
	}
	if (!sageMessage.hasCommandOrQueryOrSlicedContent) {
		const autoCharacter = sageMessage.game?.getAutoCharacterForChannel(sageMessage.user.did, sageMessage.threadDid)
			?? sageMessage.game?.getAutoCharacterForChannel(sageMessage.user.did, sageMessage.channelDid)
			?? sageMessage.user.getAutoCharacterForChannel(sageMessage.threadDid)
			?? sageMessage.user.getAutoCharacterForChannel(sageMessage.channelDid);
		if (autoCharacter) {
			return {
				type: autoCharacter.isGM ? "gm" : "pc",
				name: autoCharacter.name,
				displayName: undefined,
				title: undefined,
				imageUrl: undefined,
				embedColor: undefined,
				content: sageMessage.slicedContent
			};
		}
	}
	return null;
}

//#endregion

//#region Dialog Listener

/** Returns the dialog content if found or null otherwise. */
async function isDialog(sageMessage: SageMessage): Promise<TCommandAndArgsAndData<TDialogContent> | null> {
	if (!sageMessage.allowDialog) {
		return null;
	}

	const dialogContent = parseOrAutoDialogContent(sageMessage);
	if (!dialogContent?.content) {
		return null;
	}

	return {
		command: dialogContent.type,
		args: undefined, //new SageMessageArgs(),
		data: dialogContent
	};
}

async function doDialog(sageMessage: SageMessage, dialogContent: TDialogContent): Promise<void> {
	switch (dialogContent.type) {
		case "npc": case "enemy": case "ally": return npcChat(sageMessage, dialogContent);
		case "gm": return gmChat(sageMessage, dialogContent);
		case "pc": return pcChat(sageMessage, dialogContent);
		case "alt": case "companion": case "hireling": return companionChat(sageMessage, dialogContent);
		case "edit": return editChat(sageMessage, dialogContent);
		default: return aliasChat(sageMessage, dialogContent);// console.warn(`Invalid dialogContent.type(${dialogContent.type})`);
	}
}

//#endregion

// #region NPC Dialog
async function npcChat(sageMessage: SageMessage, dialogContent: TDialogContent): Promise<void> {
	const npc = dialogContent.name && findNpc(sageMessage, dialogContent.name);
	if (npc) {
		return <Promise<void>>sendDialogPost(sageMessage, {
			authorName: dialogContent.displayName, // defaults to character.name
			character: npc,
			colorType: getColorType(dialogContent.type) ?? undefined,
			content: dialogContent.content,
			imageUrl: dialogContent.imageUrl,
			embedColor: dialogContent.embedColor,
			title: dialogContent.title
		}).catch(console.error);
	} else {
		return sageMessage.reactWarn();
	}
}
// #endregion

// #region GM Dialog
async function gmChat(sageMessage: SageMessage, dialogContent: TDialogContent): Promise<void> {
	const gm = await findGm(sageMessage);
	if (gm) {
		return <Promise<void>>sendDialogPost(sageMessage, {
			authorName: dialogContent.displayName, // defaults to character.name
			character: gm,
			colorType: ColorType.GameMaster,
			content: dialogContent.content,
			imageUrl: dialogContent.imageUrl,
			embedColor: dialogContent.embedColor,
			title: dialogContent.title
		}).catch(console.error);
	}
	return sageMessage.reactWarn();
}
// #endregion

// #region PC Dialog
async function pcChat(sageMessage: SageMessage, dialogContent: TDialogContent): Promise<void> {
	const pc = findPc(sageMessage, dialogContent.name);
	if (pc) {
		return <Promise<void>>sendDialogPost(sageMessage, {
			authorName: dialogContent.displayName, // defaults to character.name
			character: pc,
			colorType: ColorType.PlayerCharacter,
			content: dialogContent.content,
			imageUrl: dialogContent.imageUrl,
			embedColor: dialogContent.embedColor,
			title: dialogContent.title
		}).catch(console.error);
	}
	return sageMessage.reactWarn();
}
// #endregion

// #region Companion Dialog
async function companionChat(sageMessage: SageMessage, dialogContent: TDialogContent): Promise<void> {
	const companion = findCompanion(sageMessage, dialogContent.name);
	if (companion) {
		return <Promise<void>>sendDialogPost(sageMessage, {
			authorName: dialogContent.displayName, // defaults to character.name
			character: companion,
			colorType: getColorType(dialogContent.type) ?? undefined,
			content: dialogContent.content,
			imageUrl: dialogContent.imageUrl,
			embedColor: dialogContent.embedColor,
			title: dialogContent.title
		}).catch(console.error);
	}
	return sageMessage.reactWarn();
}
// #endregion

// #region Edit Dialog

function updateEmbed(originalEmbed: Discord.MessageEmbed, title: Optional<string>, imageUrl: Optional<string>, content: string): Discord.MessageEmbed {
	const updatedEmbed = new Discord.MessageEmbed();
	updatedEmbed.setTitle(title ?? originalEmbed.title ?? "");
	updatedEmbed.setDescription(content);
	updatedEmbed.setThumbnail(imageUrl ?? originalEmbed.thumbnail?.url ?? "");
	updatedEmbed.setColor(originalEmbed.color as Discord.ColorResolvable);
	return updatedEmbed;
}

function dialogMessageToDiscordKey(dialogMessage: TDialogMessage): DiscordKey {
	return new DiscordKey(dialogMessage.serverDid, dialogMessage.channelDid, dialogMessage.threadDid, dialogMessage.messageDid);
}
async function findLastMessage(sageMessage: SageMessage, messageDid: Optional<Discord.Snowflake>): Promise<TDialogMessage | null> {
	if (DiscordId.isValidId(messageDid) && messageDid !== NilSnowflake) {
		const messageKey = new DiscordKey(sageMessage.server?.did, null, null, messageDid);
		return DialogMessageRepository.read(messageKey);
	}

	let lastMessages: TDialogMessage[] = [];
	if (sageMessage.game) {
		if (sageMessage.isPlayer) {
			lastMessages.push(...(sageMessage.playerCharacter?.getLastMessages(sageMessage.discordKey) ?? []));
		} else if (sageMessage.isGameMaster) {
			lastMessages.push(...sageMessage.game.nonPlayerCharacters.getLastMessages(sageMessage.discordKey));
		}
	} else {
		lastMessages.push(...sageMessage.user.playerCharacters.getLastMessages(sageMessage.discordKey));
		lastMessages.push(...sageMessage.user.nonPlayerCharacters.getLastMessages(sageMessage.discordKey));
	}
	lastMessages.sort((a, b) => a.timestamp - b.timestamp);
	return lastMessages.pop() ?? null;
}

function getDialogArgNotDid(arg: Optional<string>): string | null {
	return DiscordId.isValidId(arg) ? null : arg ?? null;
}

async function editChat(sageMessage: SageMessage, dialogContent: TDialogContent): Promise<void> {
	const messageDid = dialogContent.name,
		dialogMessage = await findLastMessage(sageMessage, messageDid).catch(utils.ConsoleUtils.Catchers.errorReturnNull),
		discordKey = dialogMessage ? dialogMessageToDiscordKey(dialogMessage) : null,
		message = discordKey ? await sageMessage.discord.fetchMessage(discordKey) : null;
	if (!message) {
		return sageMessage.reactWarn();
	}

	const embed = message.embeds[0],
		updatedTitle = getDialogArgNotDid(dialogContent.title),
		updatedImageUrl = dialogContent.imageUrl,
		updatedContent = sageMessage.caches.format(dialogContent.content),
		updatedEmbed = updateEmbed(embed, updatedTitle, updatedImageUrl, updatedContent);
	if (sageMessage.dialogType === "Webhook") {
		const webhook = await sageMessage.discord.fetchWebhook(sageMessage.server.did, sageMessage.threadOrChannelDid, SageDialogWebhookName);
		if (webhook) {
			await webhook.editMessage(message.id, { embeds:[updatedEmbed], threadId:sageMessage.threadDid }).then(() => sageMessage.message.delete(), console.error);
		}else {
			return sageMessage.reactWarn();
		}
	} else {
		message.edit({ embeds:[updatedEmbed] }).then(() => sageMessage.message.delete(), console.error);
	}
	return Promise.resolve();
}

// #endregion

// #region Alias Dialog

function updateAliasDialogArgsAndReturnType(sageMessage: SageMessage, dialogContent: TDialogContent): TDialogContent | null {
	const aliasFound = sageMessage.user.aliases.findByName(dialogContent.type, true);
	if (!aliasFound) {
		return null;
	}

	const aliasContent = parseDialogContent(aliasFound.target, sageMessage.user?.allowDynamicDialogSeparator)!;
	return {
		type: aliasContent.type,
		name: aliasContent.name,
		displayName: aliasContent.displayName,
		title: dialogContent.title ?? aliasContent.title,
		imageUrl: dialogContent.imageUrl ?? aliasContent.imageUrl,
		embedColor: dialogContent.embedColor ?? aliasContent.embedColor,
		content: (aliasContent.content ?? "").replace(/\\n/g, "<br/>") + dialogContent.content
	};
}

async function aliasChat(sageMessage: SageMessage, dialogContent: TDialogContent): Promise<void> {
	if (dialogContent) {
		const updatedDialogContent = updateAliasDialogArgsAndReturnType(sageMessage, dialogContent);
		if (updatedDialogContent) {
			switch (updatedDialogContent.type) {
				case "gm":
					return gmChat(sageMessage, updatedDialogContent);
				case "npc": case "ally": case "enemy":
					return npcChat(sageMessage, updatedDialogContent);
				case "pc":
					return pcChat(sageMessage, updatedDialogContent);
				case "alt": case "hireling": case "companion":
					return companionChat(sageMessage, updatedDialogContent);
			}
			return sageMessage.reactWarn();
		}
	}
}

// #endregion

// #region Delete Dialog

async function isDelete(sageReaction: SageReaction): Promise<TCommand | null> {
	sageReaction.discord
	const messageReaction = sageReaction.messageReaction;
	const message = messageReaction.message;
	if (!message.deletable || !ActiveBot.isActiveBot(message.author?.id)) {
		return null;
	}

	const game = sageReaction.caches.game;
	const server = sageReaction.caches.server;
	const bot = sageReaction.caches.bot;
	const deleteEmoji = (game ?? server ?? bot).getEmoji(EmojiType.CommandDelete);
	if (messageReaction.emoji.name !== deleteEmoji) {
		return null;
	}

	const userDid = sageReaction.user.id;
	if (game && !game.hasUser(userDid)) {
		return null;
	}

	const dialogMessage = await DialogMessageRepository.read(sageReaction.discordKey);
	const isDelete = dialogMessage && (
		dialogMessage.userDid === userDid
		|| (game && game.nonPlayerCharacters.findById(dialogMessage.characterId) && game.hasGameMaster(userDid))
	);
	return isDelete ? { command: "dialog-delete" } : null;
}

async function doDelete(sageReaction: SageReaction): Promise<void> {
	await sageReaction.messageReaction.message.delete();
}

// #endregion

// #region Pin

function isValidPinAction(sageReaction: SageReaction): boolean {
	const message = sageReaction.messageReaction.message;
	if (!message.pinnable) {
		return false;
	}
	if (message.pinned && sageReaction.isAdd) {
		return false;
	}
	if (!message.pinned && sageReaction.isRemove) {
		return false;
	}
	return true;
}

async function isPin(sageReaction: SageReaction): Promise<TCommand | null> {
	const messageReaction = sageReaction.messageReaction;
	const message = messageReaction.message;

	if (!isValidPinAction(sageReaction)) {
		return null;
	}

	const game = sageReaction.caches.game;
	if (!game?.hasUser(sageReaction.user.id)) {
		return null;
	}

	const isBotOrWebhook = await isAuthorBotOrWebhook(sageReaction);
	const messageAuthorDid = message.author?.id;
	if (!isBotOrWebhook && !game.hasUser(messageAuthorDid)) {
		return null;
	}

	const gamePinEmoji = game && game.getEmoji(EmojiType.CommandPin);
	const emoji = sageReaction.messageReaction.emoji;
	if (emoji.name !== gamePinEmoji) {
		return null;
	}

	return !sageReaction.isRemove || messageReaction.count === 0
		? { command: "dialog-pin" }
		: null;
}

async function doPin(sageReaction: SageReaction): Promise<void> {
	if (sageReaction.isAdd) {
		await sageReaction.messageReaction.message.pin();
	} else if (sageReaction.isRemove) {
		await sageReaction.messageReaction.message.unpin();
	}
}

// #endregion

export default function register(): void {
	registerMessageListener(isDialog, doDialog, MessageType.Both, undefined, undefined, 0);

	// registerInlineHelp("Dialog", "edit::{content}");
	// registerInlineHelp("Dialog", "{type}::{content}");
	// registerInlineHelp("Dialog", "{type}::{name}::{content}");
	// registerInlineHelp("Dialog", "{type}::{name}(display name)::{content}");
	// registerInlineHelp("Dialog", "{type}::{name}(display name)::(title)::{content}");
	// registerInlineHelp("Dialog", "{type} :: {name} ( {display name} ) :: ( {title} ) :: {color} :: {content}");
	registerInlineHelp("Dialog",
		"\ntype::name(display name)::(title)::color::avatar::content"
		+ "\n - <b>type</b>: gm, npc, enemy, ally, pc, alt, companion, hireling"
		+ "\n - <b>name</b>: the name of the npc, pc, or companion to post as"
		+ "\n - - <i>optional for PCs in a game</i>"
		+ "\n - <b>display name</b>: the name to post as"
		+ "\n - - <i>optional: defaults to character name or 'Game Master' for GM</i>"
		+ "\n - <b>title</b>: a title or descripiton of the dialog <i>optional</i>"
		+ "\n - <b>color</b>: a color to override the dialog color with"
		+ "\n - - <i>optional: expects hex value 0x000000 or #FFFFFF</i>"
		+ "\n - <b>avatar</b>: a url to override the avatar image"
		+ "\n - - <i>optional</i>"
		+ "\n - <b>content</b>: everything you want to post in your dialog"
		+ "\n - - accepts normal discord/markup as well as custom Sage markup"
		+ "\n"
		+ "\n<u>Examples:</u>"
		+ "\ngm::You see a fork in the road up ahead."
		+ "\ngm::(The Weather turns ...)::The wind picks up, rain begins to fall, and lightning flashes!"
		+ `\nnpc::Seela::"Hello, and well met!"`
		+ `\npc::I move behind the spork to flank and attack!`
		+ "\nedit::I move behind the orc to flank and attack!"
	);

	registerReactionListener(isDelete, doDelete, ReactionType.Add);

	registerReactionListener(isPin, doPin);
}
