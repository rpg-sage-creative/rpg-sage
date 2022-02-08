import type * as Discord from "discord.js";
import { DiscordId, NilSnowflake, TChannel } from "../../../discord";
import { sendWebhook } from "../../../discord/messages";
import { discordPromptYesNo } from "../../../discord/prompts";
import type { Optional, OrUndefined } from "../../../../sage-utils";
import type CharacterManager from "../../model/CharacterManager";
import GameCharacter from "../../model/GameCharacter";
import type SageMessage from "../../model/SageMessage";
import type { TNames } from "../../model/SageMessageArgsManager";
import { createAdminRenderableContent, registerAdminCommand } from "../cmd";
import { registerAdminCommandHelp } from "../help";

//#region Character Command Types

type TCharacterTypeMetaMatchFlags = {
	isCompanion: boolean;
	isGm: boolean;
	isMy: boolean;
	isNpc: boolean;
	isPc: boolean;
};
type TCharacterTypeMeta = TCharacterTypeMetaMatchFlags & {
	commandDescriptor?: string;
	isGmOrNpc: boolean;
	isPcOrCompanion: boolean;
	pluralDescriptor?: string;
	singularDescriptor?: string;
};

function getCharacterTypeMetaMatchFlags(sageMessage: SageMessage): TCharacterTypeMetaMatchFlags {
	const isCompanion = sageMessage.command.match(/^(my-?)?(companion|alt|familiar)/i) !== null;
	const isGm = sageMessage.command.match(/^(my-?)?(gm|gamemaster)/i) !== null;
	const isMy = sageMessage.command.match(/^my/i) !== null;
	const isNpc = sageMessage.command.match(/^(my-?)?(npc|nonplayercharacter)/i) !== null;
	const isPc = sageMessage.command.match(/^(my-?)?(pc|playercharacter)/i) !== null;
	return {
		isCompanion, isGm, isMy, isNpc, isPc
	};
}
function getCharacterTypeMetaText(matchFlags: TCharacterTypeMetaMatchFlags, values: string[]): OrUndefined<string> {
	if (matchFlags.isCompanion) {
		return values[0];
	}else if (matchFlags.isPc) {
		return values[1];
	}else if (matchFlags.isNpc) {
		return values[2];
	}else if (matchFlags.isGm) {
		return values[3];
	}else {
		return undefined;
	}
}
function getCharacterTypeMeta(sageMessage: SageMessage): TCharacterTypeMeta {
	const matchFlags = getCharacterTypeMetaMatchFlags(sageMessage);
	return {
		commandDescriptor: getCharacterTypeMetaText(matchFlags, ["companion", "playerCharacter", "nonPlayerCharacter", "gameMaster"]),
		isGmOrNpc: matchFlags.isGm || matchFlags.isNpc,
		isPcOrCompanion: matchFlags.isPc || matchFlags.isCompanion,
		pluralDescriptor: getCharacterTypeMetaText(matchFlags, ["Companions", "Player Characters", "Non-Player Characters", "Game Masters"]),
		singularDescriptor: getCharacterTypeMetaText(matchFlags, ["Companion", "Player Character", "Non-Player Character", "Game Master"]),
		...matchFlags
	};
}

//#endregion

//#region helpers

async function getUserDid(sageMessage: SageMessage): Promise<Discord.Snowflake | null> {
	return !sageMessage.game || sageMessage.isPlayer
		? sageMessage.authorDid
		: sageMessage.args.removeAndReturnUserDid("user");
}

function testCanAdminCharacter(sageMessage: SageMessage, characterTypeMeta: TCharacterTypeMeta): boolean {
	if (!sageMessage.allowAdmin) {
		return false;
	}

	if (sageMessage.game) {
		return characterTypeMeta.isPcOrCompanion
			? sageMessage.isGameMaster || sageMessage.isPlayer
			: sageMessage.isGameMaster;
	}

	return characterTypeMeta.isPcOrCompanion;
	// TODO: When we have NPCs outside of games ... return true;
}

function urlToName(url: Optional<string>): string | undefined {
	return url?.split("/").pop()?.split(".").shift();
}

async function promptAndDo(sageMessage: SageMessage, character: GameCharacter, prompt: string, action: (char: GameCharacter) => Promise<boolean>): Promise<void> {
	await sendGameCharacter(sageMessage, character);
	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors());
	promptRenderable.append(prompt);
	const yes = await discordPromptYesNo(sageMessage, promptRenderable);
	if (yes === true) {
		const updated = await action(character);
		await sageMessage.reactSuccessOrFailure(updated);
	}
}

async function removeAndReturnChannelDids(sageMessage: SageMessage): Promise<Discord.Snowflake[]> {
	const channelDids = <Discord.Snowflake[]>[];
	let channelDid: Optional<Discord.Snowflake>;
	do {
		channelDid = await sageMessage.args.removeAndReturnChannelDid();
		if (channelDid) {
			channelDids.push(channelDid);
		}
	} while (channelDid);
	if (!channelDids.length && sageMessage.channelDid) {
		channelDids.push(sageMessage.channelDid);
	}
	return channelDids;
}

function getAutoGameCharacter(sageMessage: SageMessage): OrUndefined<GameCharacter> {
	if (sageMessage.game) {
		if (sageMessage.isGameMaster) {
			return sageMessage.game.nonPlayerCharacters.findByName(sageMessage.game.gmCharacterName ?? GameCharacter.defaultGmCharacterName);
		}
		return sageMessage.game.playerCharacters.findByUser(sageMessage.user.did);
	}
	return undefined;
}
async function removeAuto(sageMessage: SageMessage, ...channelDids: Discord.Snowflake[]): Promise<void> {
	const gameCharacter = getAutoGameCharacter(sageMessage);
	for (const channelDid of channelDids) {
		const char = gameCharacter ?? sageMessage.user.getAutoCharacterForChannel(channelDid);
		await char?.removeAutoChannel(channelDid);
	}
}

/** Reusable code to get GameCharacter for the commands. */
async function getCharacter(sageMessage: SageMessage, characterTypeMeta: TCharacterTypeMeta, userDid: Discord.Snowflake, names: TNames): Promise<GameCharacter | undefined> {
	const hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.user;
	let characterManager: Optional<CharacterManager> = characterTypeMeta.isGmOrNpc ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters;
	if (characterTypeMeta.isCompanion) {
		characterManager = characterManager?.findByUserAndName(userDid, names.charName!)?.companions;
	}
	return characterManager?.findByName(names.oldName ?? names.name!);
}

//#endregion

//#region Render Character / Characters

export async function sendGameCharacter(sageMessage: SageMessage, character: GameCharacter): Promise<Discord.Message[]> {
	const ownerGuildMember = character.userDid ? await sageMessage.discord.fetchGuildMember(character.userDid) : null,
		ownerTag = ownerGuildMember?.user ? `@${ownerGuildMember.user.tag}` : ownerGuildMember?.displayName ?? character.userDid,
		renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), character.name);

	if (character.embedColor) {
		renderableContent.setColor(character.embedColor);
	}
	if (character.avatarUrl) {
		renderableContent.setThumbnailUrl(character.avatarUrl);
	}

	const ownerOrPlayer = character.isGMorNPC ? "Owner" : "Player";
	renderableContent.append(`<b>${ownerOrPlayer}</b> ${ownerTag ?? "<i>none</i>"}`);
	if (character.isCompanion) {
		renderableContent.append(`<b>Character</b> ${character.parent?.name ?? "<i>unknown</i>"}`);
	} else {
		const companionNames = character.companions.map(companion => companion.name).join(", ");
		renderableContent.append(`<b>Companions</b> ${companionNames || "<i>none</i>"}`);
	}
	renderableContent.append(`<b>Dialog Color</b> ${character.embedColor ?? "<i>unset</i>"}`);

	const autoChannels = character.autoChannels;
	const autoChannelLinks = autoChannels.map(channelDid => DiscordId.toChannelReference(channelDid)).join(", ");
	renderableContent.append(`<b>Auto Dialog</b> ${autoChannelLinks || "<i>none</i>"}`);

	const stats = character.notes.getStats().map(note => note.title ? `<b>${note.title}</b> ${note.note}` : note.note);
	if (stats.length) {
		renderableContent.appendTitledSection(`<b>Stats</b>`, ...stats);
	}

	const notes = character.notes.getUncategorizedNotes().map(note => note.title ? `<b>${note.title}</b> ${note.note}` : note.note);
	if (notes.length) {
		renderableContent.appendTitledSection(`<b>Notes</b>`, ...notes);
	}

	const targetChannel = (await sageMessage.caches.discord.fetchChannel(sageMessage.channel?.sendCommandTo)) ?? sageMessage.message.channel as TChannel;
	const avatarUrl = character.tokenUrl ?? sageMessage.bot.tokenUrl;
	return sendWebhook(sageMessage.caches, targetChannel, renderableContent, { avatarURL: avatarUrl, username: character.name });
}

function sendNotFound(sageMessage: SageMessage, command: string, entityNamePlural: string, nameFilter?: string): Promise<void> {
	const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `<b>${command}</b>`);
	if (nameFilter) {
		renderableContent.append(`<b>Filtered by:</b> ${nameFilter}`);
	}
	renderableContent.append(`<blockquote>No ${entityNamePlural} Found!</blockquote>`);
	return <any>sageMessage.send(renderableContent);
}

async function sendGameCharactersOrNotFound(sageMessage: SageMessage, characterManager: Optional<CharacterManager>, command: string, entityNamePlural: string): Promise<void> {
	const nameFilter = sageMessage.args.removeAndReturnName(true),
		hasNameFilter = nameFilter?.length,
		characters: GameCharacter[] = hasNameFilter ? characterManager?.filterByName(nameFilter) ?? [] : characterManager?.slice() ?? [];
	if (characters.length) {
		// Always show the Game Master first
		const gmIndex = characters.findIndex(character => character.isGM);
		if (gmIndex > 0) {
			const gm = characters.splice(gmIndex, 1).pop()!;
			characters.unshift(gm);
		}

		const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `<b>${command}</b>`);
		if (hasNameFilter) {
			renderableContent.append(`<b>Filtered by:</b> ${nameFilter}`);
		}
		renderableContent.append(`<blockquote>${characters.length} ${entityNamePlural} Found!</blockquote>`);
		await sageMessage.send(renderableContent);

		for (const character of characters) {
			await sendGameCharacter(sageMessage, character);
		}
	} else {
		await sendNotFound(sageMessage, command, entityNamePlural, nameFilter);
	}
	return Promise.resolve();
}

// async function getCharacter(sageMessage: SageMessage): Promise<GameCharacter> {
// 	const characterTypeMeta = getCharacterTypeMeta(sageMessage),
// 		userDid = await getUserDid(sageMessage),
// 		hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.user,
// 		characterManager = characterTypeMeta.isNpc ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters,
// 		names = sageMessage.args.removeAndReturnNames("charName", "name");

// 	return characterTypeMeta.isCompanion
// 		? characterManager.findCompanion(userDid, names.charName, names.name)
// 		: characterManager.findByUserAndName(userDid, names.name);
// }

//#endregion

async function gameCharacterList(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	const hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.user;

	let characterManager: Optional<CharacterManager> = characterTypeMeta.isGmOrNpc ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters;
	if (characterTypeMeta.isCompanion) {
		const userDid = await getUserDid(sageMessage),
			names = sageMessage.args.removeAndReturnNames(true),
			characterName = names.charName ?? names.name ?? sageMessage.playerCharacter?.name,
			character = characterManager.findByUserAndName(userDid, characterName);
		characterManager = character?.companions;
	}

	return sendGameCharactersOrNotFound(sageMessage, characterManager, `${characterTypeMeta.commandDescriptor}-list`, characterTypeMeta.pluralDescriptor!);
}

function findCompanion(characterManager: CharacterManager, userDid: Optional<Discord.Snowflake>, names: TNames): GameCharacter | undefined {
	const character = names.charName
		? characterManager.findByUserAndName(userDid, names.charName)
		: characterManager.filterByUser(userDid ?? NilSnowflake)?.[0];
	if (!character) {
		return undefined;
	}

	return names.name
		? character.companions.findByName(names.name)
		: character.companions[0] ?? undefined;
}

async function gameCharacterDetails(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	const userDid = await getUserDid(sageMessage),
		hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.user,
		characterManager = characterTypeMeta.isGmOrNpc ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters,
		names = characterTypeMeta.isGm ? <TNames>{ name: sageMessage.game?.gmCharacterName ?? GameCharacter.defaultGmCharacterName } : sageMessage.args.removeAndReturnNames(true);

	const character = characterTypeMeta.isCompanion
		? findCompanion(characterManager, userDid, names)
		: characterManager.findByUserAndName(userDid, names.name) ?? characterManager.filterByUser(userDid!)[0];

	return character
		? <any>sendGameCharacter(sageMessage, character)
		: sendNotFound(sageMessage, `${characterTypeMeta.commandDescriptor}-details`, characterTypeMeta.singularDescriptor!, names.name);
}

async function gameCharacterAdd(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	const userDid = await getUserDid(sageMessage),
		names = sageMessage.args.removeAndReturnNames(),
		core = sageMessage.args.removeAndReturnCharacterOptions(names, userDid!);
	if (!core.name) {
		core.name = urlToName(core.tokenUrl) ?? urlToName(core.avatarUrl)!;
	}

	const hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.user;

	let characterManager = characterTypeMeta.isGmOrNpc ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters;
	if (characterTypeMeta.isCompanion) {
		const character = characterManager.findByUserAndName(userDid, names.charName!)!;
		core.userDid = character.userDid;
		characterManager = character.companions;
	}
	if (!characterManager) {
		return sageMessage.reactFailure();
	}

	const newChar = new GameCharacter(core, characterManager);
	return promptAndDo(sageMessage, newChar, `Create ${newChar.name}?`, async char => {
		if (sageMessage.game && userDid) {
			// why? console.log("Checking owner's status as player/gm ...");
			if (characterTypeMeta.isNpc) {
				if (!sageMessage.game.hasGameMaster(userDid)) {
					const gameMasterAdded = await sageMessage.game.addGameMasters([userDid]);
					if (!gameMasterAdded) {
						await sageMessage.reactFailure();
						return false;
					}
				}
			} else {
				if (!sageMessage.game.hasPlayer(userDid)) {
					const playerAdded = await sageMessage.game.addPlayers([userDid]);
					if (!playerAdded) {
						await sageMessage.reactFailure();
						return false;
					}
				}
			}
		}
		const gc = await characterManager.addCharacter(char.toJSON());
		// console.log(gc, gc?.toJSON())
		return Promise.resolve(!!gc);
	});
}

async function gameCharacterUpdate(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	const names = sageMessage.args.removeAndReturnNames();
	if (characterTypeMeta.isGm) {
		if (names.newName) {
			names.oldName = sageMessage.game?.gmCharacterName ?? GameCharacter.defaultGmCharacterName;
		}
		if (names.count === 0) {
			names.name = sageMessage.game?.gmCharacterName ?? GameCharacter.defaultGmCharacterName;
		}
	}

	const userDid = await getUserDid(sageMessage),
		newUserDid = await sageMessage.args.removeAndReturnUserDid("newuser") ?? await sageMessage.args.removeAndReturnUserDid("user"),
		core = sageMessage.args.removeAndReturnCharacterOptions(names, newUserDid ?? userDid!),
		character = await getCharacter(sageMessage, characterTypeMeta, userDid!, names);

	if (character) {
		await character.update(core, false);
		return promptAndDo(sageMessage, character, `Update ${character.name}?`, async char => {
			const charSaved = await char.save();
			if (charSaved && characterTypeMeta.isGm) {
				sageMessage.game!.updateGmCharacterName(char.name);
				return sageMessage.game!.save();
			}
			return charSaved;
		});
	}
	return sageMessage.reactFailure();
}

async function gameCharacterStats(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	const userDid = await getUserDid(sageMessage),
		names = sageMessage.args.removeAndReturnNames(),
		character = await getCharacter(sageMessage, characterTypeMeta, userDid!, names);

	if (character) {
		character.notes.updateStats(sageMessage.args.keyValuePairs(), false);
		return promptAndDo(sageMessage, character, `Update ${character.name}?`, async char => {
			const charSaved = await char.save();
			if (charSaved && characterTypeMeta.isGm) {
				sageMessage.game!.updateGmCharacterName(char.name);
				return sageMessage.game!.save();
			}
			return charSaved;
		});
	}
	return sageMessage.reactFailure();
}

async function characterDelete(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	const userDid = await getUserDid(sageMessage),
		hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.user,
		characterManager = characterTypeMeta.isGmOrNpc ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters,
		names = sageMessage.args.removeAndReturnNames(true);

	const character = characterTypeMeta.isCompanion
		? characterManager.findCompanion(userDid, names.charName!, names.name!)
		: characterManager.findByUserAndName(userDid, names.name!);

	if (character) {
		return promptAndDo(sageMessage, character, `Delete ${character.name}?`, char => char.remove());
	}
	return sendNotFound(sageMessage, `${characterTypeMeta.commandDescriptor}-delete`, characterTypeMeta.singularDescriptor!, names.name);
}

async function characterAutoOn(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	// MUST RUN removeAndReturnChannelDids BEFORE NAME
	const channelDids = await removeAndReturnChannelDids(sageMessage);
	const name = sageMessage.isGameMaster
		? (sageMessage.game?.gmCharacterName ?? GameCharacter.defaultGmCharacterName)
		: sageMessage.args.removeAndReturnName(true);
	const character = sageMessage.isGameMaster
		? sageMessage.game?.nonPlayerCharacters.findByName(name)
		: (sageMessage.playerCharacter ?? sageMessage.user.playerCharacters.findByName(name));

	if (character) {
		const channelLinks = channelDids.map(channelDid => DiscordId.toChannelReference(channelDid));
		const prompt = channelDids.length > 1 || channelDids[0] !== sageMessage.channelDid
			? `Use Auto Dialog with ${character.name} for the given channel(s)?\n> ${channelLinks.join("\n> ")}`
			: `Use Auto Dialog with ${character.name}?`;

		return promptAndDo(sageMessage, character, prompt, async char => {
			await removeAuto(sageMessage, ...channelDids);
			channelDids.forEach(channelDid => char.addAutoChannel(channelDid, false));
			return char.save();
		});
	}
	return sendNotFound(sageMessage, `${characterTypeMeta.commandDescriptor}-auto-on`, characterTypeMeta.singularDescriptor!, name);
}

async function characterAutoOff(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	// removeAndReturnChannelDids MUST RUN BEFORE removeAndReturnName
	const channelDids = await removeAndReturnChannelDids(sageMessage);
	const name = sageMessage.isGameMaster
		? (sageMessage.game?.gmCharacterName ?? GameCharacter.defaultGmCharacterName)
		: sageMessage.args.removeAndReturnName(true);
	const character = sageMessage.isGameMaster
		? sageMessage.game?.nonPlayerCharacters.findByName(name)
		: (sageMessage.playerCharacter ?? sageMessage.user.playerCharacters.findByName(name));

	if (character) {
		const channelLinks = channelDids.map(channelDid => DiscordId.toChannelReference(channelDid));
		const prompt = channelDids.length > 1 || channelDids[0] !== sageMessage.channelDid
			? `Stop using Auto Dialog with ${character.name} for the given channel(s)?\n> ${channelLinks.join("\n> ")}`
			: `Stop using Auto Dialog with ${character.name}?`;

		return promptAndDo(sageMessage, character, prompt, async char => {
			await removeAuto(sageMessage, ...channelDids);
			return char.save();
		});
	}
	return sendNotFound(sageMessage, `${characterTypeMeta.commandDescriptor}-auto-off`, characterTypeMeta.singularDescriptor!, name);
}

//#region Register Help

function registerHelp(): void {
	const AdminCategory = "Admin";
	const playerCharacterSubCategory = "PC";
	const nonPlayerCharacterSubCategory = "NPC";
	const companionSubCategory = "Companion";
	[playerCharacterSubCategory, nonPlayerCharacterSubCategory, companionSubCategory].forEach(subCat => {
		const charName = subCat === companionSubCategory ? ` charname="character name"` : ``;
		const cmd = subCat.toLowerCase();
		registerAdminCommandHelp(AdminCategory, subCat, `${cmd} list "optional filter"`);
		registerAdminCommandHelp(AdminCategory, subCat, `${cmd} details "name"`);
		registerAdminCommandHelp(AdminCategory, subCat, `${cmd} create ${charName} name="name" avatar="image url" token="image url"`);
		registerAdminCommandHelp(AdminCategory, subCat, `${cmd} update ${charName} name="name" avatar="image url"`);
		registerAdminCommandHelp(AdminCategory, subCat, `${cmd} update ${charName} oldname="old name" newname="new name"`);
		registerAdminCommandHelp(AdminCategory, subCat, `${cmd} delete ${charName} name="name"`);
	});
}
//#endregion

export default function register(): void {
	registerAdminCommand(gameCharacterList, "pc-list", "pcs-list", "my-pc-list", "my-pcs");
	registerAdminCommand(gameCharacterList, "npc-list", "npcs-list", "my-npc-list", "my-npcs");
	registerAdminCommand(gameCharacterList, "companion-list", "my-companion-list", "my-companions");
	registerAdminCommand(gameCharacterDetails, "pc-details", "npc-details", "companion-details", "gm-details");
	registerAdminCommand(gameCharacterAdd, `pc-create`, `npc-create`, `companion-create`);
	registerAdminCommand(gameCharacterUpdate, "pc-update", "npc-update", "companion-update", "gm-update");
	registerAdminCommand(gameCharacterStats, "pc-stats", "npc-stats", "companion-stats");
	registerAdminCommand(characterDelete, "pc-delete", "npc-delete", "companion-delete");
	registerAdminCommand(characterAutoOn, "pc-auto-on", "gm-auto-on");
	registerAdminCommand(characterAutoOff, "pc-auto-off", "gm-auto-off");

	registerHelp();
}
