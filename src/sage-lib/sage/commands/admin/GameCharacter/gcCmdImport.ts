import { error } from "@rsc-utils/core-utils";
import { isInvalidWebhookUsername } from "@rsc-utils/discord-utils";
import { discordPromptYesNo } from "../../../../discord/prompts.js";
import type { CharacterManager } from "../../../model/CharacterManager.js";
import { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { getCharactersArgs } from "./getCharacterArgs.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";

export async function gcCmdImport(sageMessage: SageMessage): Promise<void> {
	const localize = sageMessage.getLocalizer();

	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		if (characterTypeMeta.isGmOrNpcOrMinion && !sageMessage.game) {
			return sageMessage.replyStack.whisper(localize("NPC_ONLY_IN_GAME"));
		}
		return sageMessage.replyStack.whisper(localize("CANNOT_IMPORT_CHARACTERS_HERE"));
	}

	const allResults = await getCharactersArgs(sageMessage, characterTypeMeta.isGm, false);
	if (!allResults) return sageMessage.replyStack.whisper(`Sorry, this command only imports TSV attachments or urls.`);

	const missingNames = allResults.filter(result => !result.core?.name).length;
	const invalidNames = allResults.filter(result => result.core?.name).map(result => isInvalidWebhookUsername(result.core?.name)).filter(name => name !== false);
	const longNames = invalidNames.filter(name => name === true).length;
	const bannedNames = invalidNames.filter((name, i, a) => name !== true && a.indexOf(name) === i) as string[];
	if (missingNames || longNames || bannedNames.length) {
		let content = `Sorry, at least one of the following occurred:`;
		if (missingNames) content += `\n- ` + localize("USERNAME_MISSING");
		if (longNames) content += `\n- ` + localize("USERNAME_TOO_LONG");
		bannedNames.forEach(bannedName => content += `\n- ` + localize("USERNAME_BANNED", bannedName));
		return sageMessage.replyStack.whisper(content);
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
		if (!core?.name) { error(`Importing a character without a name.`); continue; }
		if (isInvalidWebhookUsername(core.name)) { error(`Importing a character with an invalid name.`); continue; }

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