import { AttachmentBuilder } from "discord.js";
import { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { cannotManageCharacter } from "./cannotManageCharacter.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";

export async function gcCmdExport(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);

	// initial check of permission to manage characters
	if (await cannotManageCharacter(sageMessage, characterTypeMeta, "EXPORT")) {
		return;
	}

	const hasCharacters = sageMessage.game ?? sageMessage.sageUser;

	const tsvKeys = new Set<string>();
	const appendKey = (...keys: string[]) => keys.forEach(key => tsvKeys.add(key.toLowerCase()));
	// core
	appendKey("type", "name", "charName", "alias", "avatar", "color", "token", "user");

	const tsvMap = new Map<string, Record<string, string>>();
	const appendChar = (char: GameCharacter) => {
		const map: Record<string, string> = { };
		map["type"] = char.type;
		map["name"] = char.name;
		if (char.parent) map["charname"] = char.parent.name;
		if (char.alias) map["alias"] = char.alias;
		if (char.avatarUrl) map["avatar"] = char.avatarUrl;
		if (char.embedColor) map["color"] = char.embedColor;
		if (char.tokenUrl) map["token"] = char.tokenUrl;
		if (char.userDid) map["user"] = char.userDid;
		char.notes.getStats().forEach(stat => {
			appendKey(stat.title);
			map[stat.title.toLowerCase()] = stat.note;
		});
		tsvMap.set(char.id, map);
		char.companions.forEach(appendChar);
	};

	// save for filename
	let charName: string | undefined;

	const names = sageMessage.args.getNames();
	if (!names.charName && !names.name) {
		if (characterTypeMeta.isGmOrNpcOrMinion) {
			hasCharacters.nonPlayerCharacters.forEach(appendChar);
		}else if (characterTypeMeta.isPcOrCompanion) {
			hasCharacters.playerCharacters.forEach(appendChar);
		}
	}else {
		const character = hasCharacters.findCharacterOrCompanion(names.charName ?? names.name!);
		if (!character) {
			return sageMessage.replyStack.whisper(`Sorry, we cannot find "${names.charName ?? names.name}".`);
		}
		if ("game" in character) {
			if (!character.game) {
				return sageMessage.replyStack.whisper(`Sorry, we cannot find "${names.charName ?? names.name}".`);
			}
			appendChar(character.game);
		}else {
			appendChar(character);
		}
		// save for filename
		charName = character.alias ?? character.name;

		// revalidate permission to manage character
		if (await cannotManageCharacter(sageMessage, characterTypeMeta, "EXPORT", character)) {
			return;
		}
	}

	if (!tsvMap.size) {
		return sageMessage.replyStack.whisper(`Sorry, something went wrong with the export.`);
	}

	const output: string[] = [];
	output.push([...tsvKeys].join("\t"));
	tsvMap.forEach(charMap => {
		const line: string[] = [];
		for (const key of tsvKeys) {
			line.push(charMap[key] ?? "");
		}
		output.push(line.join("\t"));
	});

	// get input
	const fileNameCleanupRegExp = /[^\w\.\-]+/g;
	let fileName = sageMessage.args.getString("fileName")?.replace(fileNameCleanupRegExp, "-")
		?? charName?.replace(fileNameCleanupRegExp, "-")
		?? `RPG-Sage-Character-Export-${characterTypeMeta.isGmOrNpcOrMinion ? "NPC" : "PC"}.tsv`;
	// make sure it ends with .tsv
	fileName = fileName.replace(/(\.tsv)?$/i, ".tsv");
	const attachment = new AttachmentBuilder(Buffer.from(output.join("\n")), { name:fileName });

	await sageMessage.replyStack.reply({ content:`Here are your exported characters!`, files:[attachment] });
}