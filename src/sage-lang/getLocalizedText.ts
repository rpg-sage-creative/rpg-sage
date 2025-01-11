import type { Optional } from "@rsc-utils/core-utils";
import { stringFormat } from "@rsc-utils/string-utils";

const DISCORD_POLICY = `[(Discord Policy)](<https://discord.com/developers/docs/resources/user>)`;

const enUS = {

	"CATEGORY": `Category`,
	"CLOSE": `Close`,
	"COMPANION": "Companion",
	"CONTENT": `Content`,
	"COPY": `Copy`,
	"CREATE": `Create`,
	"DELETE": `Delete`,
	"DICE": `Dice`,
	"EDIT": `Edit`,
	"EMBED": `Embed`,
	"FROM": `From`,
	"IMPORT": `Import`,
	"ITEMS": `Items`,
	"MATH": `Math`,
	"MINION": "Minion",
	"NAME": `Name`,
	"NEW": `New`,
	"NOTE": `Note`,
	"NPC": "NPC",
	"PAGE": `Page`,
	"PC": "PC",
	"REIMPORT": `Reimport`,
	"SHARE": `Share`,
	"TABLE": `Table`,
	"TO": `To`,
	"UNCATEGORIZED": `Uncategorized`,
	"UPDATE": `Update`,
	"USAGE": `Usage`,
	"WARNING": `Warning`,

	"TABLE_URL": `Table Url`,

	"IMPORT_ERROR": "Import Error!",
	"REIMPORT_ERROR": "Reimport Error!",

	"FEATURE_NOT_IMPLEMENTED": `Sorry, that feature hasn't been implemented yet!`,

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

	// MACROS
	"CANNOT_DELETE_MACRO_HERE": `Sorry, you cannot delete macros here.`,
	"CANNOT_MANAGE_MACRO_HERE": `Sorry, you cannot manage macros here.`,
	"MACRO_DETAILS": `Macro Details`,
	"MACRO_LIST": `Macro List`,
	"MACRO_S_NOT_FOUND": `Macro "#{0}" ***NOT*** found!`,
	"NO_MACROS_FOUND": `No Macros Found!`,
	"TO_VIEW_MACRO_USE_:": `To view a macro, use:`,
	"TO_CREATE_MACRO_USE_:": `To create a macro, use:`,

	"INVALID_TABLE_DATA": `Invalid Table Data.`,

	"CREATE_USER_MACRO": `Create User Macro`,
	"EDIT_USER_MACRO": `Edit User Macro`,

	"MACRO_NAME_PLACEHOLDER": `Macro names can only be letters and numbers.`,
	"MACRO_CATEGORY_PLACEHOLDER": `Macro categories group related macros together.`,
	"MACRO_TABLE_PLACEHOLDER": `The table you wish to roll on or the URL to the table.`,
	"MACRO_ITEMS_PLACEHOLDER": `The items you wish to randomly select from.`,
	"MACRO_DICE_PLACEHOLDER": `The dice you wish to roll, ex: [1d20 attack; 1d6 damage]`,

	"CREATE_MACRO_?": `Create Macro?`,

	"DELETE_ALL": `Delete All`,
	"DELETE_CATEGORY": `Delete Category`,

	"DELETE_MACRO_?": `Delete Macro?`,
	"DELETE_ALL_X_MACROS_?": `Delete All #{0} Macros?`,
	"MACRO_S_DELETED": `Macro "#{0}" deleted.`,
	"MACRO_S_NOT_DELETED": `Macro "#{0}" ***NOT*** deleted!`,

	"UPDATE_MACRO_?": `Update Macro?`,
	"MACRO_S_UPDATED": `Macro "#{0}" updated.`,
	"MACRO_S_NOT_UPDATED": `Macro "#{0}" ***NOT*** updated!`,

	"OVERRIDES_SAGE_DIALOG_EMOJI": `This overrides Sage dialog emoji:`,

	// sample macro name
	"MACRO_NAME_EXAMPLE": `SwordAttack`,

	// deleteButton
	"DELETE_THIS_ALERT": `Delete this alert.`,
	"MESSAGE_WAS_DELETED": `A message from RPG Sage to you was deleted in #{0} by #{1}.`,
	"UNABLE_TO_DELETE_MESSAGE_:": `Sorry, RPG Sage is not able to delete this message: #{0}`,

	"SAGE_MISSING_PERM_IN_THAT_CHANNEL": `RPG Sage doesn't appear to have the #{0} permission in that channel.`,
	"SAGE_MISSING_ACCESS_TO_THAT_CHANNEL": `RPG Sage doesn't appear to have access to that channel.`,
	"WE_TRIED_TO_DM_YOU": `We tried to DM this alert to you, but were unable to.`,
};

export type LocalizedTextKey = keyof typeof enUS;

const all = {
	"en-US": enUS,
};

export type Lang = keyof typeof all;

type Arg = Optional<string | number>;

export type Localizer = (key: LocalizedTextKey, ...args: Arg[]) => string;

export function getLocalizedText(key: LocalizedTextKey, lang: Lang, ...args: Arg[]): string {
	return stringFormat(all[lang]?.[key] ?? enUS[key], ...args);
}

export function hasLocalizedText(key: string): key is LocalizedTextKey {
	return key in enUS;
}