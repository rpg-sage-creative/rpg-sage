import type { Message, Snowflake } from "discord.js";
import type { Optional, OrUndefined } from "../../../../sage-utils";
import DiscordId from "../../../../sage-utils/utils/DiscordUtils/DiscordId";
import { orNilSnowflake } from "../../../../sage-utils/utils/DiscordUtils/snowflake";
import { sendWebhook } from "../../../discord/messages";
import { discordPromptYesNo } from "../../../discord/prompts";
import type CharacterManager from "../../model/CharacterManager";
import GameCharacter, { GameCharacterCore } from "../../model/GameCharacter";
import type SageMessage from "../../model/SageMessage";
import type { TNames } from "../../model/SageMessageArgs";
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

function getUserDid(sageMessage: SageMessage): Snowflake | null {
	return !sageMessage.game || sageMessage.isPlayer
		? sageMessage.actor.did
		: sageMessage.args.findUserDid("user") ?? null;
}

function testCanAdminCharacter(sageMessage: SageMessage, characterTypeMeta: TCharacterTypeMeta): boolean {
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

async function promptAndDo(sageMessage: SageMessage, character: GameCharacter, prompt: string, action: (char: GameCharacter) => Promise<boolean | void>): Promise<void> {
	await sendGameCharacter(sageMessage, character);
	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors());
	promptRenderable.append(prompt);
	const yes = await discordPromptYesNo(sageMessage, promptRenderable);
	if (yes === true) {
		const updated = await action(character);
		if (updated !== undefined) {
			await sageMessage.reactSuccessOrFailure(updated, "", "");
		}
	}
}

/** If in a Game, returns the GameMaster for a GM or the PC for a Player. */
function getAutoGameCharacter(sageMessage: SageMessage): OrUndefined<GameCharacter> {
	if (sageMessage.game) {
		if (sageMessage.isGameMaster) {
			return sageMessage.game.nonPlayerCharacters.findByName(sageMessage.game.gmCharacterName ?? GameCharacter.defaultGmCharacterName);
		}
		return sageMessage.game.playerCharacters.findByUser(sageMessage.actor.s.did);
	}
	return undefined;
}

/** For each channel given, the actor's auto channel character is removed. */
async function removeAuto(sageMessage: SageMessage, ...channelDids: Snowflake[]): Promise<void> {
	const gameCharacter = getAutoGameCharacter(sageMessage);
	for (const channelDid of channelDids) {
		const char = gameCharacter ?? sageMessage.actor.s.getAutoCharacterForChannel(channelDid);
		if (char) {
			const saved = await char.removeAutoChannel(channelDid);
			if (!saved) {
				await sageMessage.whisper(`[command-error] Unknown Error; Unable to remove Auto Dailog for "${char.name}" in ${DiscordId.toChannelReference(channelDid)}`);
			}
		}
	}
}

/** Reusable code to get GameCharacter for the commands. */
async function getCharacter(sageMessage: SageMessage, characterTypeMeta: TCharacterTypeMeta, userDid: Snowflake, names: TNames): Promise<GameCharacter | undefined> {
	const hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.actor.s;
	let characterManager: Optional<CharacterManager> = characterTypeMeta.isGmOrNpc ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters;
	if (characterTypeMeta.isCompanion) {
		characterManager = characterManager?.findByUserAndName(userDid, names.charName!)?.companions;
	}
	return characterManager?.findByName(names.oldName ?? names.name!);
}

//#endregion

//#region Render Character / Characters

export async function sendGameCharacter(sageMessage: SageMessage, character: GameCharacter): Promise<Message[]> {
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

	const targetChannel = sageMessage.message.channel;
	const avatarUrl = character.tokenUrl ?? sageMessage.bot.tokenUrl;
	return sendWebhook(sageMessage.sageCache, targetChannel, renderableContent, { avatarURL: avatarUrl, username: character.name }, sageMessage.dialogType);
}

function sendNotFound(sageMessage: SageMessage, command: string, entityNamePlural: string, nameFilter?: Optional<string>): Promise<void> {
	const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `<b>${command}</b>`);
	if (nameFilter) {
		renderableContent.append(`<b>Filtered by:</b> ${nameFilter}`);
	}
	renderableContent.append(`<blockquote>No ${entityNamePlural} Found!</blockquote>`);
	return <any>sageMessage.send(renderableContent);
}

async function sendGameCharactersOrNotFound(sageMessage: SageMessage, characterManager: Optional<CharacterManager>, command: string, entityNamePlural: string): Promise<void> {
	const nameFilter = sageMessage.args.valueByKey("filter"),
		hasNameFilter = nameFilter?.length,
		characters: GameCharacter[] = hasNameFilter ? characterManager?.filterByName(nameFilter, true) ?? [] : characterManager?.slice() ?? [];
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

		let nameIndex = 0;
		for (const character of characters) {
			if (!character.name) {
				character.name = nameIndex ? `Unnamed Character ${nameIndex}` : `Unnamed Character`;
				nameIndex++;
				await character.save();
			}
			await sendGameCharacter(sageMessage, character);
		}
	} else {
		await sendNotFound(sageMessage, command, entityNamePlural, nameFilter);
	}
	return Promise.resolve();
}

//#endregion

async function gameCharacterList(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("List Characters");
	if (denial) {
		return denial;
	}

	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock("You don't have access to those characters!");
	}

	const hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.actor.s;

	let characterManager: Optional<CharacterManager> = characterTypeMeta.isGmOrNpc ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters;
	if (characterTypeMeta.isCompanion) {
		const userDid = await getUserDid(sageMessage),
			charName = sageMessage.args.valueByKey("charName"),
			characterName = charName ?? sageMessage.playerCharacter?.name,
			character = characterManager.findByUserAndName(userDid, characterName);
		characterManager = character?.companions;
	}

	return sendGameCharactersOrNotFound(sageMessage, characterManager, `${characterTypeMeta.commandDescriptor}-list`, characterTypeMeta.pluralDescriptor!);
}

function findCompanion(characterManager: CharacterManager, userDid: Optional<Snowflake>, names: TNames): GameCharacter | undefined {
	const character = names.charName
		? characterManager.findByUserAndName(userDid, names.charName)
		: characterManager.filterByUser(orNilSnowflake(userDid))?.[0];
	if (!character) {
		return undefined;
	}

	return names.name
		? character.companions.findByName(names.name)
		: character.companions[0] ?? undefined;
}

async function gameCharacterDetails(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Character Details");
	if (denial) {
		return denial;
	}

	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock(sageMessage.game ? "Must be a GM or Player of this game." : "Cannot *currently* use NPCs outside a Game.");
	}

	const userDid = getUserDid(sageMessage),
		hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.actor.s,
		characterManager = characterTypeMeta.isGmOrNpc ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters,
		names = characterTypeMeta.isGm ? <TNames>{ name: sageMessage.game?.gmCharacterName ?? GameCharacter.defaultGmCharacterName } : sageMessage.args.findNames();

	const character = characterTypeMeta.isCompanion
		? findCompanion(characterManager, userDid, names)
		: characterManager.findByUserAndName(userDid, names.name) ?? characterManager.filterByUser(userDid!)[0];

	return character
		? <any>sendGameCharacter(sageMessage, character)
		: sendNotFound(sageMessage, `${characterTypeMeta.commandDescriptor}-details`, characterTypeMeta.singularDescriptor!, names.name);
}

async function gameCharacterAdd(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Add Character");
	if (denial) {
		return denial;
	}

	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock(sageMessage.game ? "Must be a GM or Player of this game." : "Cannot *currently* use NPCs outside a Game.");
	}

	const userDid = getUserDid(sageMessage),
		charArgs = sageMessage.args.findCharacterArgs(),
		core = { userDid, ...charArgs } as GameCharacterCore;
	if (!core.name) {
		core.name = urlToName(core.tokenUrl) ?? urlToName(core.avatarUrl)!;
	}
	if (!core.name) {
		return sageMessage.reactFailure("Cannot create a character without a name!");
	}

	const hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.actor.s;

	let characterManager = characterTypeMeta.isGmOrNpc ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters;
	if (characterTypeMeta.isCompanion) {
		const character = characterManager.findByUserAndName(userDid, sageMessage.args.valueByKey("charName")) ?? characterManager.findByUser(userDid!)!;
		core.userDid = character.userDid;
		characterManager = character.companions;
	}
	if (!characterManager) {
		return sageMessage.reactFailure("Unable to find Character for this Companion.");
	}

	const newChar = new GameCharacter(core, characterManager);
	return promptAndDo(sageMessage, newChar, `Create ${newChar.name}?`, async char => {
		// if (sageMessage.game && userDid) {
		// 	// why? console.log("Checking owner's status as player/gm ...");
		// 	if (characterTypeMeta.isNpc) {
		// 		if (!sageMessage.game.hasGameMaster(userDid)) {
		// 			const gameMasterAdded = await sageMessage.game.addGameMasters([userDid]);
		// 			if (!gameMasterAdded) {
		// 				await sageMessage.reactFailure("Unable to add GM on the fly.");
		// 				return;
		// 			}
		// 		}
		// 	} else {
		// 		if (!sageMessage.game.hasPlayer(userDid)) {
		// 			const playerAdded = await sageMessage.game.addPlayers([userDid]);
		// 			if (!playerAdded) {
		// 				await sageMessage.reactFailure("Unable to add Player on the fly.");
		// 				return;
		// 			}
		// 		}
		// 	}
		// }
		const gc = await characterManager.addCharacter(char.toJSON());
		await sageMessage.reactSuccessOrFailure(!!gc, "Character Created.", "Unknown Error; Character NOT Created.");
	});
}

async function gameCharacterUpdate(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Update Character");
	if (denial) {
		return denial;
	}

	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock(sageMessage.game ? "Must be a GM or Player of this game." : "Cannot *currently* create NPCs outside a Game.");
	}

	const names = sageMessage.args.findNames();
	if (characterTypeMeta.isGm) {
		if (names.newName) {
			names.oldName = sageMessage.game?.gmCharacterName ?? GameCharacter.defaultGmCharacterName;
		}
		if (names.count === 0) {
			names.name = sageMessage.game?.gmCharacterName ?? GameCharacter.defaultGmCharacterName;
		}
	}

	const userDid = getUserDid(sageMessage),
		newUserDid = sageMessage.args.findUserDid("newUser") ?? sageMessage.args.findUserDid("user"),
		charArgs = sageMessage.args.findCharacterArgs(),
		character = await getCharacter(sageMessage, characterTypeMeta, userDid!, names);

	if (character) {
		const core = {
			avatarUrl: charArgs.avatarUrl,
			embedColor: charArgs.embedColor,
			name: names.newName ?? names.name,
			tokenUrl: charArgs.tokenUrl,
			userDid: newUserDid ?? userDid
		} as GameCharacterCore;
		await character.update(core, false);
		return promptAndDo(sageMessage, character, `Update ${character.name}?`, async char => {
			const charSaved = await char.save();
			if (charSaved && characterTypeMeta.isGm) {
				sageMessage.game!.updateGmCharacterName(char.name);
				const gameSaved = await sageMessage.game!.save();
				await sageMessage.reactSuccessOrFailure(charSaved && gameSaved, "Game Master Updated", "Unknown Error; Game Master NOT Updated!");
				return;
			}
			await sageMessage.reactSuccessOrFailure(charSaved, "Character Updated", "Unknown Error; Character NOT Updated!");
		});
	}
	return sageMessage.reactFailure("Character not found.");
}

async function gameCharacterStats(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Update Character Stats");
	if (denial) {
		return denial;
	}

	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock(sageMessage.game ? "Must be a GM or Player of this game." : "Cannot *currently* create NPCs outside a Game.");
	}

	const userDid = getUserDid(sageMessage),
		names = sageMessage.args.findNames(),
		character = await getCharacter(sageMessage, characterTypeMeta, userDid!, names);

	if (character) {
		character.notes.updateStats(sageMessage.args.keyed(), false);
		return promptAndDo(sageMessage, character, `Update ${character.name}?`, async char => {
			const charSaved = await char.save();
			if (charSaved && characterTypeMeta.isGm) {
				sageMessage.game!.updateGmCharacterName(char.name);
				const gameSaved = await sageMessage.game!.save();
				await sageMessage.reactSuccessOrFailure(charSaved && gameSaved, "Game Master Updated", "Unknown Error; Game Master NOT Updated!");
				return;
			}
			await sageMessage.reactSuccessOrFailure(charSaved, "Character Updated", "Unknown Error; Character NOT Updated!");
		});
	}
	return sageMessage.reactFailure("Character not found.");
}

async function characterDelete(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Delete Character");
	if (denial) {
		return denial;
	}

	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock(sageMessage.game ? "Must be a GM or Player of this game." : "Cannot *currently* create NPCs outside a Game.");
	}

	const userDid = getUserDid(sageMessage),
		hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.actor.s,
		characterManager = characterTypeMeta.isGmOrNpc ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters,
		names = sageMessage.args.findNames();

	const character = characterTypeMeta.isCompanion
		? characterManager.findCompanion(userDid, names.charName!, names.name!)
		: characterManager.findByUserAndName(userDid, names.name!);

	if (character) {
		return promptAndDo(sageMessage, character, `Delete ${character.name}?`, async char => {
			const removed = await char.remove();
			await sageMessage.reactSuccessOrFailure(removed, "Character Deleted.", "Unknown Error; Character NOT Deleted!");
		});
	}
	return sendNotFound(sageMessage, `${characterTypeMeta.commandDescriptor}-delete`, characterTypeMeta.singularDescriptor!, names.name);
}

async function characterAutoOn(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Character Auto Dialog");
	if (denial) {
		return denial;
	}

	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock(sageMessage.game ? "Must be a GM or Player of this game." : "Cannot *currently* create NPCs outside a Game.");
	}

	const name = sageMessage.isGameMaster
		? (sageMessage.game?.gmCharacterName ?? GameCharacter.defaultGmCharacterName)
		: sageMessage.args.valueByKey("name");
	const character = sageMessage.isGameMaster
		? sageMessage.game?.nonPlayerCharacters.findByName(name)
		: (sageMessage.playerCharacter ?? sageMessage.actor.s.playerCharacters.findByName(name));

	if (character) {
		const channelDids = sageMessage.args.channelDids(true);
		const channelLinks = channelDids.map(channelDid => DiscordId.toChannelReference(channelDid));
		const prompt = channelDids.length > 1 || channelDids[0] !== sageMessage.channelDid
			? `Use Auto Dialog with ${character.name} for the given channel(s)?\n> ${channelLinks.join("\n> ")}`
			: `Use Auto Dialog with ${character.name}?`;

		return promptAndDo(sageMessage, character, prompt, async char => {
			await removeAuto(sageMessage, ...channelDids);
			channelDids.forEach(channelDid => char.addAutoChannel(channelDid, false));
			const saved = await char.save();
			await sageMessage.reactSuccessOrFailure(saved, "Auto Dialog Enabled", "Unknown Error; Auto Dialog NOT Enabled!");
		});
	}
	return sendNotFound(sageMessage, `${characterTypeMeta.commandDescriptor}-auto-on`, characterTypeMeta.singularDescriptor!, name);
}

async function characterAutoOff(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Character Auto Dialog");
	if (denial) {
		return denial;
	}

	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock(sageMessage.game ? "Must be a GM or Player of this game." : "Cannot *currently* create NPCs outside a Game.");
	}

	const name = sageMessage.isGameMaster
		? (sageMessage.game?.gmCharacterName ?? GameCharacter.defaultGmCharacterName)
		: sageMessage.args.valueByKey("name");
	const character = sageMessage.isGameMaster
		? sageMessage.game?.nonPlayerCharacters.findByName(name)
		: (sageMessage.playerCharacter ?? sageMessage.actor.s.playerCharacters.findByName(name));

	if (character) {
		const channelDids = sageMessage.args.channelDids(true);
		const channelLinks = channelDids.map(channelDid => DiscordId.toChannelReference(channelDid));
		const prompt = channelDids.length > 1 || channelDids[0] !== sageMessage.channelDid
			? `Stop using Auto Dialog with ${character.name} for the given channel(s)?\n> ${channelLinks.join("\n> ")}`
			: `Stop using Auto Dialog with ${character.name}?`;

		return promptAndDo(sageMessage, character, prompt, async char => {
			await removeAuto(sageMessage, ...channelDids);
			const saved = await char.save();
			await sageMessage.reactSuccessOrFailure(saved, "Auto Dialog Disabled", "Unknown Error; Auto Dialog NOT Disabled!");
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
		const charName = subCat === companionSubCategory ? ` charName="character name"` : ``;
		const cmd = subCat.toLowerCase();
		registerAdminCommandHelp(AdminCategory, subCat, `${cmd} list filter="optional filter"`);
		registerAdminCommandHelp(AdminCategory, subCat, `${cmd} details name="name"`);
		registerAdminCommandHelp(AdminCategory, subCat, `${cmd} create ${charName} name="name" avatar="image url" token="image url"`);
		registerAdminCommandHelp(AdminCategory, subCat, `${cmd} update ${charName} name="name" avatar="image url"`);
		registerAdminCommandHelp(AdminCategory, subCat, `${cmd} update ${charName} oldName="old name" newName="new name"`);
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
