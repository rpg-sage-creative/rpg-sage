import { error } from "@rsc-utils/core-utils";
import { DiscordMaxValues, isInvalidWebhookUsername } from "@rsc-utils/discord-utils";
import { discordPromptYesNo } from "../../../../discord/prompts.js";
import type { CharacterManager } from "../../../model/CharacterManager.js";
import { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { getCharactersArgs } from "./getCharacterArgs.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";

type CharData = { name:string; type:string; action:string; };
function createAttemptPromptContent(prompt: string, chars: CharData[]): string {
	const maxLength = DiscordMaxValues.message.contentLength;
	const promptLength = prompt.length;

	// try the full info as intended
	const full = chars.map(({ name, action, type }) => `\n> - ${action}: ${name} ${type}`).join("");
	if (maxLength >= promptLength + full.length) {
		return prompt + full;
	}

	// if types are same, don't include type
	const firstType = chars[0]?.type;
	const mixedTypes = chars.some(({ type }) => type !== firstType);
	if (!mixedTypes) {
		const withoutType = chars.map(({ name, action }) => `\n> - ${action}: ${name}`).join("");
		if (maxLength >= promptLength + withoutType.length) {
			return prompt + withoutType;
		}
	}

	/** @todo generate a list until we run out of characters and then say "... and X others." */

	// return just the prompt to at least let them import
	return prompt;
}

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
	if (!allResults) return sageMessage.replyStack.whisper(localize("COMMAND_ONLY_IMPORTS_TSV"));

	const missingNames = allResults.filter(result => !result.core?.name).length;
	const invalidNames = allResults.filter(result => result.core?.name).map(result => isInvalidWebhookUsername(result.core?.name)).filter(name => name !== false);
	const longNames = invalidNames.filter(name => name === true).length;
	const bannedNames = invalidNames.filter((name, i, a) => name !== true && a.indexOf(name) === i) as string[];
	if (missingNames || longNames || bannedNames.length) {
		let content = localize("AT_LEAST_ONE_OCCURRED");
		if (missingNames) content += `\n- ` + localize("USERNAME_MISSING");
		if (longNames) content += `\n- ` + localize("USERNAME_TOO_LONG");
		bannedNames.forEach(bannedName => content += `\n- ` + localize("USERNAME_S_BANNED", bannedName));
		return await sageMessage.replyStack.whisper(content);
	}

	const hasCharacters = sageMessage.game ?? sageMessage.sageUser;

	const charData = allResults.map(({ names, type }) => {
		const exists = hasCharacters.findCharacterOrCompanion(names.name!);
		const action = localize(exists ? "UPDATE" : "CREATE");
		const _type = type ? ` *(${localize(type.toUpperCase() as "PC").toLowerCase()})*` : ``;
		return { name:names.name!, action, type:_type };
	});
	const prompt = localize("ATTEMPT_IMPORT_OF_X_CHARACTERS", allResults.length);
	const promptContent = createAttemptPromptContent(prompt, charData);

	const response = await discordPromptYesNo(sageMessage, promptContent, true);
	if (!response) return sageMessage.replyStack.whisper(localize("NO_IMPORT_ATTEMPTED"));

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
			output.push(localize("CANNOT_IMPORT_S", names.name!));
			output.push(`- ${localize("CHARACTER_S_NOT_FOUND", names.charName!)}`);
			continue;
		}

		const existing = characterManager.findByName(core.name);
		if (existing) {
			if (!core.userDid) core.userDid = userId;
			const updated = await existing.update(core, false);
			const changed = await existing.processStatsAndMods(stats, mods);
			changes ||= updated || !!changed.size;
			const key = updated || changed ? "CHARACTER_S_UPDATED" : "CHARACTER_S_NOT_UPDATED";
			output.push(localize(key, existing.name));

		}else {
			core.userDid = userId;
			const newChar = new GameCharacter(core, characterManager);
			await newChar.processStatsAndMods(stats, mods);
			const added = await characterManager!.addCharacter(newChar.toJSON());
			changes ||= !!added;
			const key = added ? "CHARACTER_S_CREATED" : "CHARACTER_S_NOT_CREATED";
			output.push(localize(key, newChar.name));
		}
	}

	if (changes) {
		const saved = await hasCharacters.save();
		if (saved) {
			await sageMessage.replyStack.send(output.join("\n"));
			return;
		}
	}

	await sageMessage.replyStack.send(localize("SOMETHING_WRONG_IMPORT"));
}