import { ColorResolvable, Embed, EmbedBuilder, Message, Snowflake, WebhookMessageCreateOptions } from "discord.js";
import * as _XRegExp from "xregexp";
import type { Optional, OrUndefined, TParsers } from "../../../sage-utils";
import { errorReturnEmptyArray, errorReturnNull } from "../../../sage-utils/utils/ConsoleUtils/Catchers";
import { MessageType, ReactionType } from "../../../sage-utils/utils/DiscordUtils";
import DiscordId from "../../../sage-utils/utils/DiscordUtils/DiscordId";
import DiscordKey from "../../../sage-utils/utils/DiscordUtils/DiscordKey";
import { embedsToTexts } from "../../../sage-utils/utils/DiscordUtils/embeds";
import { isNonNilSnowflake } from "../../../sage-utils/utils/DiscordUtils/snowflake";
import { RenderableContent } from "../../../sage-utils/utils/RenderUtils";
import { isBlank } from "../../../sage-utils/utils/StringUtils";
import { tokenize } from "../../../sage-utils/utils/StringUtils/Tokenizer";
import type { TCommand, TCommandAndArgsAndData } from "../../discord";
import { registerMessageListener, registerReactionListener } from "../../discord/handlers";
import { replaceWebhook, sendWebhook } from "../../discord/messages";
import type CharacterManager from "../model/CharacterManager";
import { GameRoleType } from "../model/Game";
import GameCharacter, { type GameCharacterCore } from "../model/GameCharacter";
import { ColorType } from "../model/HasColorsCore";
import { EmojiType } from "../model/HasEmojiCore";
import type SageMessage from "../model/SageMessage";
import type SageReaction from "../model/SageReaction";
import { DialogType } from "../repo/base/channel";
import DialogMessageRepository, { TDialogMessage } from "../repo/DialogMessageRepository";
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
async function sendDialogRenderable(sageMessage: SageMessage, renderableContent: RenderableContent, authorOptions: WebhookMessageCreateOptions): Promise<Message[]> {
	const targetChannel = await sageMessage.discord.fetchChannel(sageMessage.channel?.sendDialogTo);
	if (targetChannel) {
		// const sent = sageMessage.dialogType === "Webhook"
		// 	? await sendWebhook(sageMessage.sageCache, targetChannel, renderableContent, authorOptions).catch(utils.ConsoleUtils.Catchers.errorReturnEmptyArray)
		// 	: await send(sageMessage.sageCache, targetChannel, renderableContent, sageMessage.message.author).catch(utils.ConsoleUtils.Catchers.errorReturnEmptyArray);
		const sent = await sendWebhook(sageMessage.sageCache, targetChannel, renderableContent, authorOptions, sageMessage.dialogType).catch(errorReturnEmptyArray);
		if (sent.length) {
			// sageMessage._.set("Dialog", sent[sent.length - 1]);
			// if (sageMessage.message.deletable) {
			// 	sageMessage.message.delete();
			// }
		}
		return sent;
	} else {
		// const replaced = sageMessage.dialogType === "Webhook"
		// 	? await replaceWebhook(sageMessage.sageCache, sageMessage.message, renderableContent, authorOptions).catch(utils.ConsoleUtils.Catchers.errorReturnEmptyArray)
		// 	: await replace(sageMessage.sageCache, sageMessage.message, renderableContent).catch(utils.ConsoleUtils.Catchers.errorReturnEmptyArray);
		const replaced = await replaceWebhook(sageMessage.sageCache, sageMessage.message, renderableContent, authorOptions, sageMessage.dialogType).catch(errorReturnEmptyArray);
		if (replaced.length) {
			// sageMessage._.set("Dialog", replaced[replaced.length - 1]);
			// if (sageMessage._.has("Dice")) {
			// 	await sageMessage.reactDie();
			// }
		}
		return replaced;
	}
}

async function sendDialogPost(sageMessage: SageMessage, postData: TDialogPostData): Promise<Message[]> {
	const character = postData?.character;
	if (!character) {
		return Promise.reject("Invalid TDialogPostData");
	}

	const webhook = true; //sageMessage.dialogType === "Webhook";
	const renderableContent = new RenderableContent();

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

	const messages: Message[] = await sendDialogRenderable(sageMessage, renderableContent, { username: authorName, avatarURL: avatarUrl })
		.catch(errorReturnEmptyArray);
	if (messages.length) {
		//#region dice
		const diceOutputs = otherDiceMatches.map(match => match.output).flat();
		if (diceOutputs.length) {
			await sendDice(sageMessage, diceOutputs);
		}
		//#endregion
		const last = messages[messages.length - 1];

		const dialogMessage: TDialogMessage = {
			discordKey: {
				channel: last.channel.id,
				message: last.id,
				server: last.guild?.id
			},
			sageKey: {
				character: character.id,
				game: sageMessage.game?.id,
				server: sageMessage.server?.id,
				user: sageMessage.actor.uuid
			},
			timestamp: last.createdTimestamp,
			userDid: character.userDid ?? sageMessage.actor.s.did
		};
		await DialogMessageRepository.write(dialogMessage);

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
		if (isBlank(pcNameOrIndex)) {
			return sageMessage.actor.s.playerCharacters.first();
		}
		return sageMessage.actor.s.playerCharacters.findByNameOrIndex(pcNameOrIndex);
	}
	return undefined;
}

function findCompanion(sageMessage: SageMessage, companionNameOrIndex: Optional<string>): GameCharacter | undefined {
	let companions: CharacterManager | undefined;
	if (sageMessage.gameChannel) {
		companions = sageMessage.playerCharacter?.companions;
	} else if (!sageMessage.channel || sageMessage.channel.dialog) {
		// Currently only allow a single PC per server outside of games
		companions = sageMessage.actor.s.playerCharacters.first()?.companions;
	}
	if (companions) {
		if (isBlank(companionNameOrIndex)) {
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
		return sageMessage.actor.s.nonPlayerCharacters.findByName(npcName);
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
			tokens = tokenize(content, parsers, "content"),
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

export async function parseOrAutoDialogContent(sageMessage: SageMessage): Promise<TDialogContent | null> {
	const content = sageMessage.message.content ?? ""; //TODO: was message.edits[0].content
	const dialogContent = parseDialogContent(content, sageMessage.actor.s?.allowDynamicDialogSeparator);
	if (dialogContent) {
		return dialogContent;
	}
	if (!sageMessage.hasCommandOrQueryOrSlicedContent) {
		const autoCharacter = await sageMessage.game?.getAutoCharacterForChannel(sageMessage.actor.did, sageMessage.discordKey.channel)
			?? sageMessage.actor.s.getAutoCharacterForChannel(sageMessage.discordKey.channel);
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
	const dialogContent = await parseOrAutoDialogContent(sageMessage);
	if (!dialogContent?.content) {
		return null;
	}

	const denial = sageMessage.checkDenyDialog();
	if (denial) {
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
		return sageMessage.reactWarn("NPC Not Found!");
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
	return sageMessage.reactWarn("GM Character Not Found!");
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
	return sageMessage.reactWarn("PC Not Found!");
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
	return sageMessage.reactWarn("Companion Not Found!");
}
// #endregion

// #region Edit Dialog

function updateEmbed(originalEmbed: Embed | undefined, title: Optional<string>, imageUrl: Optional<string>, content: string): EmbedBuilder {
	const updatedEmbed = new EmbedBuilder();
	updatedEmbed.setTitle(title ?? originalEmbed?.title ?? "");
	updatedEmbed.setDescription(content);
	updatedEmbed.setThumbnail(imageUrl ?? originalEmbed?.thumbnail?.url ?? "");
	updatedEmbed.setColor(originalEmbed?.color as ColorResolvable);
	return updatedEmbed;
}

async function findLastMessage(sageMessage: SageMessage, messageDid: Optional<Snowflake>): Promise<TDialogMessage | null> {
	if (isNonNilSnowflake(messageDid)) {
		const messageKey = DiscordKey.from({ server:sageMessage.server?.did, message:messageDid });
		return DialogMessageRepository.read(messageKey);
	}

	const lastMessages: TDialogMessage[] = [];
	if (sageMessage.game) {
		if (sageMessage.isPlayer) {
			lastMessages.push(...(sageMessage.playerCharacter?.getLastMessages(sageMessage.discordKey) ?? []));
		} else if (sageMessage.isGameMaster) {
			lastMessages.push(...sageMessage.game.nonPlayerCharacters.getLastMessages(sageMessage.discordKey));
		}
	} else {
		lastMessages.push(...sageMessage.actor.s.playerCharacters.getLastMessages(sageMessage.discordKey));
		lastMessages.push(...sageMessage.actor.s.nonPlayerCharacters.getLastMessages(sageMessage.discordKey));
	}
	lastMessages.sort((a, b) => a.timestamp - b.timestamp);
	return lastMessages.pop() ?? null;
}

function getDialogArgNotDid(arg: Optional<string>): string | null {
	return DiscordId.isValidId(arg) ? null : arg ?? null;
}

async function editChat(sageMessage: SageMessage<true>, dialogContent: TDialogContent): Promise<void> {
	const messageDid = dialogContent.name ?? sageMessage.message.reference?.messageId,
		dialogMessage = await findLastMessage(sageMessage, messageDid).catch(errorReturnNull),
		discordKey = dialogMessage ? DiscordKey.from(DialogMessageRepository.ensureDiscordKey(dialogMessage).discordKey) : null,
		message = discordKey?.hasMessage ? await sageMessage.discord.fetchMessage(discordKey.message) : null;
	if (!message) {
		return sageMessage.reactWarn("Unable to find Dialog Message!");
	}

	const embed = message.embeds[0],
		updatedTitle = getDialogArgNotDid(dialogContent.title),
		updatedImageUrl = dialogContent.imageUrl,
		updatedContent = sageMessage.sageCache.format(dialogContent.content),
		updatedEmbed = updateEmbed(embed, updatedTitle, updatedImageUrl, updatedContent),
		channelDid = sageMessage.discordKey.channel;
	const webhook = await sageMessage.sageCache.discord.fetchWebhook();
	if (webhook) {
		const content = sageMessage.dialogType === DialogType.Post ? embedsToTexts([updatedEmbed]).join("\n") : undefined;
		const embeds = sageMessage.dialogType === DialogType.Embed ? [updatedEmbed] : [];
		const channel = await sageMessage.discord.fetchChannel(channelDid);
		const threadId = channel?.isThread() ? channelDid : undefined;
		await webhook.editMessage(message.id, { content, embeds, threadId }).then(() => sageMessage.message.delete(), console.error);
	}else {
		return sageMessage.reactWarn("Unable to find Dialog Webhook!");
	}
	return Promise.resolve();
}

// #endregion

// #region Alias Dialog

function updateAliasDialogArgsAndReturnType(sageMessage: SageMessage, dialogContent: TDialogContent): TDialogContent | null {
	const aliasFound = sageMessage.actor.s.aliases.findByName(dialogContent.type, true);
	if (!aliasFound) {
		return null;
	}

	const aliasContent = parseDialogContent(aliasFound.target, sageMessage.actor.s?.allowDynamicDialogSeparator)!;
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
			return sageMessage.reactWarn("Invalid Dialog Type!");
		}
	}
}

// #endregion

// #region Delete Dialog

function isValidDeleteAction(sageReaction: SageReaction): boolean {
	const message = sageReaction.messageReaction.message;
	// check deletable
	if (!message.deletable) {
		return false;
	}
	// check we are adding the emoji
	if (sageReaction.isRemove) {
		return false;
	}

	// check the appropriate delete emoji
	const { game, server, bot } = sageReaction;
	const deleteEmoji = (game ?? server ?? bot).getEmoji(EmojiType.CommandDelete);
	const emoji = sageReaction.messageReaction.emoji;
	if (emoji.name !== deleteEmoji) {
		return false;
	}

	return true;
}

/** @todo update this to use SageCommand and likely move it to new DiscordUtils */
async function isAuthorBotOrWebhook(sageCommand: SageMessage | SageReaction): Promise<boolean> {
	const messageAuthorDid = sageCommand.message.author?.id;
	if (messageAuthorDid === sageCommand.bot.did) {
		return true;
	}
	if (!sageCommand.guild) {
		return false;
	}
	const webhook = await sageCommand.sageCache.discord.fetchWebhook();
	return webhook?.id === messageAuthorDid;
}

async function isDelete(sageReaction: SageReaction): Promise<TCommand | null> {
	if (!isValidDeleteAction(sageReaction)) {
		return null;
	}

	const userDid = sageReaction.actor.did;
	const dialogMessage = await DialogMessageRepository.read(sageReaction.discordKey, () => null);
	if (dialogMessage?.userDid === userDid) {
		// This covers PCs inside a game *AND* outside a game
		return { command: "dialog-delete" };
	}

	const { game } = sageReaction;
	if (game) {
		// only GMs at this point
		const actorIsGm = await game?.hasUser(userDid, GameRoleType.GameMaster);
		if (!actorIsGm) {
			return null;
		}

		// make sure post is from Sage
		const isBotOrWebhook = await isAuthorBotOrWebhook(sageReaction);
		// make sure post author is a GM or Player
		const authorIsGameUser = await game?.hasUser(sageReaction.message.author?.id);
		if (!isBotOrWebhook && !authorIsGameUser) {
			return null;
		}

		return { command: "dialog-delete" };
	}

	return null;
}

async function doDelete(sageReaction: SageReaction): Promise<void> {
	await sageReaction.messageReaction.message.delete();
}

// #endregion

// #region Pin

function isValidPinAction(sageReaction: SageReaction): boolean {
	const message = sageReaction.messageReaction.message;
	// check pinnable
	if (!message.pinnable) {
		return false;
	}
	// check it isn't already pinned AND we are adding emoji
	if (message.pinned && sageReaction.isAdd) {
		return false;
	}
	// check it is already pinned AND we are removing emoji
	if (!message.pinned && sageReaction.isRemove) {
		return false;
	}

	// check the appropriate pin emoji
	const { game, server, bot } = sageReaction;
	const pinEmoji = (game ?? server ?? bot).getEmoji(EmojiType.CommandPin);
	const emoji = sageReaction.messageReaction.emoji;
	if (emoji.name !== pinEmoji) {
		return false;
	}

	return true;
}

async function isPin(sageReaction: SageReaction): Promise<TCommand | null> {
	// no Game, no pins!
	const game = sageReaction.game;
	if (!game) {
		return null;
	}

	const messageReaction = sageReaction.messageReaction;
	const message = messageReaction.message;

	if (!isValidPinAction(sageReaction)) {
		return null;
	}

	const actorIsGameUser = await game.hasUser(sageReaction.actor.did);
	if (!actorIsGameUser) {
		return null;
	}

	const isBotOrWebhook = await isAuthorBotOrWebhook(sageReaction);
	const authorIsGameUser = await game.hasUser(message.author?.id);
	if (!isBotOrWebhook && !authorIsGameUser) {
		return null;
	}

	const canDoPin = !sageReaction.isRemove || messageReaction.count === 0;
	return canDoPin ? { command: "dialog-pin" } : null;
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
