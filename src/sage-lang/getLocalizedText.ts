import { stringFormat } from "@rsc-utils/string-utils";

const enUS = {
	"DISCORD_POLICY": `(Discord Policy)`,

	"CANNOT_CREATE_CHARACTERS_HERE": `Sorry, you cannot create characters here.`,
	"CANNOT_IMPORT_CHARACTERS_HERE": `Sorry, you cannot import characters here.`,

	"NPC_ONLY_IN_GAME": `Sorry, NPCs only exist inside a Game.`,

	"USERNAME_BANNED": `The username is invalid due to your use of "#{0}". (Discord Policy)`,
	"USERNAME_MISSING": `The username is missing.`,
	"USERNAME_TOO_LONG": `The username is too long. (Discord Policy)`,
};

export type LocalizedTextKey = keyof typeof enUS;

const all = {
	"en-US": enUS,
};

export type Lang = keyof typeof all;

export function getLocalizedText(key: LocalizedTextKey, lang: Lang, ...args: string[]): string {
	return stringFormat(all[lang]?.[key] ?? enUS[key], ...args);
}