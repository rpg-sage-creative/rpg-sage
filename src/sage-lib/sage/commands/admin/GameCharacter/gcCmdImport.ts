import { discordPromptYesNo } from "../../../../discord/prompts.js";
import type { CharacterManager } from "../../../model/CharacterManager.js";
import { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { getCharactersArgs } from "./getCharacterArgs.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";

export async function gcCmdImport(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		if (characterTypeMeta.isGmOrNpcOrMinion && !sageMessage.game) {
			return sageMessage.replyStack.whisper(`Sorry, NPCs only exist inside a Game.`);
		}
		return sageMessage.replyStack.whisper(`Sorry, you cannot import characters here.`);
	}

	const allResults = await getCharactersArgs(sageMessage, characterTypeMeta.isGm, false);
	if (!allResults) return sageMessage.replyStack.whisper(`Sorry, this command only imports tsv attachments or urls.`);

	let badName = false;
	let discordName = false; const discordRegexp = /discord/i;
	for (const { core } of allResults) {
		if (!core?.name) badName = true;
		else if (discordRegexp.test(core.name)) discordName = true;
	}
	if (badName || discordName) {
		return sageMessage.replyStack.whisper(`Sorry, at least one character is missing a name or has "discord" in the name.`);
	}

	const hasCharacters = sageMessage.game ?? sageMessage.sageUser;

	const allNames = allResults.map(({ names, type }) => {
		const exists = hasCharacters.findCharacterOrCompanion(names.name!);
		const action = exists ? "Update" : "Create";
		const _type = type ? ` *(${type})*` : ``;
		return `\n> - ${action}: ${names.name} ${_type}`;
	}).join("");

	const response = await discordPromptYesNo(sageMessage, `Attempt import of ${allResults.length} characters? ${allNames}`, true);
	if (!response) return sageMessage.replyStack.whisper(`No import attempted.`);

	const output: string[] = [];

	const pcUserId = characterTypeMeta.isPcOrCompanion ? sageMessage.sageUser.did : undefined;

	let changes = false;

	for (const oneResult of allResults) {
		const { core, mods, names, stats, userId = pcUserId, type = characterTypeMeta.type } = oneResult;
		if (!core?.name) { continue; }
		if (discordRegexp.test(core.name)) { continue; }

		let characterManager: CharacterManager | undefined = ["gm","npc","minion"].includes(type!) ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters;
		if (type === "companion") {
			const character = characterManager?.findByUser(userId, names.charName) ?? characterManager.findByUser(userId);
			core.userDid = character?.userDid;
			characterManager = character?.companions;
		}
		if (type === "minion") {
			const character = characterManager?.findByName(names.charName);
			characterManager = character?.companions;
		}
		if (!characterManager) {
			output.push(`Cannot import "${names.name}"`);
			output.push(`- Unable to find character "${names.charName}"`);
			continue;
		}

		const existing = characterManager.findByName(core.name);
		if (existing) {
			if (!core.userDid) core.userDid = userId;
			const updated = await existing.update(core, false);
			const changed = await existing.processStatsAndMods(stats, mods);
			changes ||= updated || changed;
			const not = updated || changed ? "" : "***NOT***";
			output.push(`Character "${existing.name}" ${not} Updated!`);

		}else {
			core.userDid = userId;
			const newChar = new GameCharacter(core, characterManager);
			await newChar.processStatsAndMods(stats, mods);
			const added = await characterManager!.addCharacter(newChar.toJSON());
			changes ||= !!added;
			const not = added ? "" : "***NOT***";
			output.push(`Character "${newChar.name}" ${not} Created!`);
		}
	}

	if (changes) {
		const saved = await hasCharacters.save();
		if (saved) {
			await sageMessage.replyStack.send(output.join("\n"));
			return;
		}
	}

	await sageMessage.replyStack.send(`Sorry, there was a problem importing.`);
}