import { stringFormat } from "@rsc-utils/string-utils";

const DISCORD_POLICY = `[(Discord Policy)](<https://discord.com/developers/docs/resources/user>)`;

const enUS = {
	"CREATE": "Create",
	"UPDATE": "Update",
	"IMPORT": "Import",
	"REIMPORT": "Reimport",

	"IMPORT_ERROR": "Import Error!",
	"REIMPORT_ERROR": "Reimport Error!",

	"PC": "PC",
	"NPC": "NPC",
	"COMPANION": "Companion",
	"MINION": "Minion",

	"SORRY_WE_DONT_KNOW": "Sorry, we don't know what went wrong!",
	"AT_LEAST_ONE_OCCURRED": `Sorry, at least one of the following occurred:`,

	"NPC_ONLY_IN_GAME": `Sorry, NPCs only exist inside a Game.`,
	"DIALOG_NOT_IN_DMS": `Sorry, Dialog does not function in DMs.`,

	"CANNOT_CREATE_CHARACTERS_HERE": `Sorry, you cannot create characters here.`,

	"CANNOT_IMPORT_CHARACTERS_HERE": `Sorry, you cannot import characters here.`,
	"COMMAND_ONLY_IMPORTS_TSV": `Sorry, this command only imports TSV attachments or urls.`,
	"ATTEMPT_IMPORT_OF_X_CHARACTERS": `Attempt import of #{0} characters?`,
	"NO_IMPORT_ATTEMPTED": `No import attempted.`,
	"CANNOT_IMPORT_S": `Cannot import "#{0}"`,
	"SOMETHING_WRONG_IMPORT": `Sorry, something went wrong with the import.`,
	"IMPORT_CHARACTERS_WIKI": `For information on importing characters, see our [wiki](<https://github.com/rpg-sage-creative/rpg-sage/wiki/Character-Management#importing-characters>)`,
	"REIMPORT_CHARACTERS_WIKI": `For information on reimporting characters, see our [wiki](<https://github.com/rpg-sage-creative/rpg-sage/wiki/Character-Management#importing-characters>)`,

	"CANNOT_EXPORT_CHARACTERS_HERE": `Sorry, you cannot export characters here.`,
	"CANNOT_EXPORT_GM": `Sorry, you cannot export the GM.`,
	"SOMETHING_WRONG_EXPORT": `Sorry, something went wrong with the export.`,
	"HERE_ARE_EXPORTED_CHARACTERS": `Here are your exported characters.`,

	"CANNOT_FIND_S": `Sorry, we cannot find "#{0}".`,

	"CHARACTER_S_CREATED": `Character "#{0}" created.`,
	"CHARACTER_S_NOT_CREATED": `Character "#{0}" ***NOT*** created!`,
	"CHARACTER_S_UPDATED": `Character "#{0}" updated.`,
	"CHARACTER_S_NOT_UPDATED": `Character "#{0}" ***NOT*** updated!`,
	"CHARACTER_S_NOT_FOUND": `Character "#{0}" ***NOT*** found!`,

	"USERNAME_S_BANNED": `The username is invalid due to your use of "#{0}". ${DISCORD_POLICY}`,
	"USERNAME_MISSING": `The username is missing.`,
	"USERNAME_TOO_LONG": `The username is too long. ${DISCORD_POLICY}`,

	// IMPORT ERRORS
	"NOTHING_TO_IMPORT": `Nothing to import.`,
	"NOTHING_TO_REIMPORT": `Nothing to reimport.`,
	"INVALID_ID": "The given ID is invalid.",
	"CHARACTER_NAME_MISMATCH": `Character names don't match.`,
	"INVALID_JSON_ATTACHMENT": "The attached JSON is invalid.",
	"INVALID_JSON_URL": "The given JSON url is invalid.",
	"INVALID_JSON": "The given JSON is invalid.",
	"UNSUPPORTED_JSON": "The given JSON is unsupported.",
	"INVALID_PDF_ATTACHMENT": "The attached PDF is invalid.",
	"INVALID_PDF_URL": "The given PDF url is invalid.",
	"INVALID_PDF": "The given PDF is invalid.",
	"UNSUPPORTED_PDF": "The given PDF is unsupported.",

	//#region map specific
	"REPLY_TO_MAP_TO_MOVE": `Please reply to the map you wish to move your token on.`,
	"INCLUDE_MOVE_DIRECTIONS": `Please include the directions you wish to move your token.`,
	"FOR_EXAMPLE:": `For example:`,
	"PROBLEM_LOADING_MAP": `Sorry, there was a problem loading your map!`,
	"UNABLE_TO_FIND_TOKEN_S": `Unable to find token: #{0}`,
	"UNABLE_TO_FIND_TERRAIN_S": `Unable to find terrain: #{0}`,
	"NO_IMAGE_TO_MOVE": `You have no image to move!`,
	"MOVE_S_S_?": `Move #{0} #{1} ?`,
	"MOVING_S_S": `Moving #{0} #{1} ...`,
	"ERROR_MOVING_IMAGE": `Error moving image!`,
	//#endregion
};

export type LocalizedTextKey = keyof typeof enUS;

const all = {
	"en-US": enUS,
};

export type Lang = keyof typeof all;

type Arg = string | number;
export function getLocalizedText(key: LocalizedTextKey, lang: Lang, ...args: Arg[]): string {
	return stringFormat(all[lang]?.[key] ?? enUS[key], ...args);
}

export function hasLocalizedText(key: string): key is LocalizedTextKey {
	return key in enUS;
}