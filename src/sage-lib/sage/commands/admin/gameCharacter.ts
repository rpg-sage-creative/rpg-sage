import type { Snowflake } from "discord.js";
import type { Optional, OrUndefined } from "../../../../sage-utils";
import { errorReturnEmptyArray } from "../../../../sage-utils/ConsoleUtils";
import { DiscordId } from "../../../../sage-utils/DiscordUtils";
import { orNilSnowflake } from "../../../../sage-utils/SnowflakeUtils";
import { discordPromptYesNo } from "../../../discord/prompts";
import type { CharacterManager } from "../../model/CharacterManager";
import { GameCharacter, GameCharacterCore } from "../../model/GameCharacter";
import type { SageMessage } from "../../model/SageMessage";
import type { TNames } from "../../model/SageMessageArgs";
import { createAdminRenderableContent, registerAdminCommand } from "../cmd";
import { registerAdminCommandHelp } from "../help";
import { gameCharacterList } from "./character/gameCharacterList";
import { TCharacterTypeMeta, getCharacterTypeMeta } from "./character/getCharacterTypeMeta";
import { getUserDid } from "./character/getUserDid";
import { sendGameCharacter } from "./character/sendGameCharacter";
import { testCanAdminCharacter } from "./character/testCanAdminCharacter";
import { sendNotFound } from "./character/sendNotFound";

//#region helpers

function urlToName(url: Optional<string>): string | undefined {
	return url?.split("/").pop()?.split(".").shift();
}

async function promptAndDo(sageMessage: SageMessage, character: GameCharacter, prompt: string, action: (char: GameCharacter) => Promise<boolean | void>): Promise<void> {
	await sendGameCharacter(sageMessage, character).catch(errorReturnEmptyArray);
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
async function fetchAutoGameCharacter(sageMessage: SageMessage): Promise<OrUndefined<GameCharacter>> {
	if (sageMessage.game) {
		if (sageMessage.isGameMaster) {
			const nonPlayerCharacters = await sageMessage.game.fetchNonPlayerCharacters();
			return nonPlayerCharacters.findByName(sageMessage.game.gmCharacterName ?? GameCharacter.defaultGmCharacterName);
		}
		const playerCharacters = await sageMessage.game.fetchPlayerCharacters();
		return playerCharacters.findByUser(sageMessage.actor.s.did);
	}
	return undefined;
}

/** For each channel given, the actor's auto channel character is removed. */
async function removeAuto(sageMessage: SageMessage, ...channelDids: Snowflake[]): Promise<void> {
	const gameCharacter = await fetchAutoGameCharacter(sageMessage);
	for (const channelDid of channelDids) {
		const char = gameCharacter ?? await sageMessage.actor.s.fetchAutoCharacterForChannel(channelDid);
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
	let characterManager: Optional<CharacterManager> = characterTypeMeta.isGmOrNpcOrMinion
		? await hasCharacters.fetchNonPlayerCharacters()
		: await hasCharacters.fetchPlayerCharacters();
	if (characterTypeMeta.isCompanion) {
		characterManager = characterManager?.findByUserAndName(userDid, names.charName!)?.companions;
	}else if (characterTypeMeta.isMinion) {
		characterManager = characterManager?.findByName(names.charName)?.companions;
	}
	return characterManager?.findByName(names.oldName ?? names.name!);
}

//#endregion

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
		characterManager = characterTypeMeta.isGmOrNpcOrMinion
			? await hasCharacters.fetchNonPlayerCharacters()
			: await hasCharacters.fetchPlayerCharacters(),
		names = characterTypeMeta.isGm ? <TNames>{ name: sageMessage.game?.gmCharacterName ?? GameCharacter.defaultGmCharacterName } : sageMessage.args.findNames();

	const character =
		characterTypeMeta.isCompanion ? findCompanion(characterManager, userDid, names)
		: characterTypeMeta.isMinion ? characterManager.findCompanionByName(names.name)
		: characterManager.findByUserAndName(userDid, names.name) ?? characterManager.filterByUser(userDid!)[0];

	return character
		? <any>sendGameCharacter(sageMessage, character).catch(errorReturnEmptyArray)
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
		core.name = urlToName(core.images?.find(img => img.tags.includes("avatar"))?.url)
			?? urlToName(core.images?.find(img => img.tags.includes("dialog"))?.url)
			?? urlToName(core.images?.find(img => img.tags.includes("token"))?.url)!;
	}
	if (!core.name) {
		return sageMessage.reactFailure("Cannot create a character without a name!");
	}

	const hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.actor.s;

	let characterManager = characterTypeMeta.isGmOrNpcOrMinion
		? await hasCharacters.fetchNonPlayerCharacters()
		: await hasCharacters.fetchPlayerCharacters();
	if (characterTypeMeta.isCompanion) {
		const character = characterManager.findByUserAndName(userDid, sageMessage.args.valueByKey("charName")) ?? characterManager.findByUser(userDid!)!;
		core.userDid = character.userDid;
		characterManager = character.companions;
	}
	if (characterTypeMeta.isMinion) {
		const character = characterManager.findByName(sageMessage.args.valueByKey("charName"));
		characterManager = character?.companions!;
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
			embedColor: charArgs.embedColor,
			images: charArgs.images,
			name: names.newName ?? names.name,
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
		characterManager = characterTypeMeta.isGmOrNpcOrMinion
			? await hasCharacters.fetchNonPlayerCharacters()
			: await hasCharacters.fetchPlayerCharacters(),
		names = sageMessage.args.findNames();

	const character =
		characterTypeMeta.isCompanion ? characterManager.findCompanion(userDid, names.charName!, names.name!)
		: characterTypeMeta.isMinion ? characterManager.findByCompanionName(names.name!)
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
		? (await sageMessage.game?.fetchNonPlayerCharacters())?.findByName(name)
		: (await sageMessage.fetchPlayerCharacter() ?? (await sageMessage.actor.s.fetchPlayerCharacters())?.findByName(name));

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
		? (await sageMessage.game?.fetchNonPlayerCharacters())?.findByName(name)
		: (await sageMessage.fetchPlayerCharacter() ?? (await sageMessage.actor.s.fetchPlayerCharacters())?.findByName(name));

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

export function register(): void {
	registerAdminCommand(gameCharacterList, "pc-list", "pcs-list", "my-pc-list", "my-pcs");
	registerAdminCommand(gameCharacterList, "npc-list", "npcs-list", "my-npc-list", "my-npcs");
	registerAdminCommand(gameCharacterList, "companion-list", "my-companion-list", "my-companions");
	registerAdminCommand(gameCharacterList, "minion-list", "my-minion-list", "my-minions");
	registerAdminCommand(gameCharacterDetails, "pc-details", "npc-details", "companion-details", "gm-details", "minion-details");
	registerAdminCommand(gameCharacterAdd, `pc-create`, `npc-create`, `companion-create`, `minion-create`);
	registerAdminCommand(gameCharacterUpdate, "pc-update", "npc-update", "companion-update", "gm-update", `minion-update`);
	registerAdminCommand(gameCharacterStats, "pc-stats", "npc-stats", "companion-stats", `minion-stats`);
	registerAdminCommand(characterDelete, "pc-delete", "npc-delete", "companion-delete", `minion-delete`);
	registerAdminCommand(characterAutoOn, "pc-auto-on", "gm-auto-on");
	registerAdminCommand(characterAutoOff, "pc-auto-off", "gm-auto-off");

	registerHelp();
}
