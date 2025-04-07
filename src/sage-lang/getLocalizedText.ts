import type { Optional } from "@rsc-utils/core-utils";
import { stringFormat } from "@rsc-utils/string-utils";
import { getWikiUrl, hasWikiUrl } from "./getWikiUrl.js";

const DISCORD_POLICY = `[(Discord Policy)](<https://discord.com/developers/docs/resources/user>)`;

const enUS = {

	"CATEGORY": `Category`,
	"CATEGORIES": `Categories`,
	"CHARACTER": `Character`,
	"CHARACTERS": `Characters`,
	"CLOSE": `Close`,
	"COMPANION": "Companion",
	"CONTENT": `Content`,
	"COPY": `Copy`,
	"CREATE": `Create`,
	"DELETE": `Delete`,
	"DIALOG": `Dialog`,
	"DICE": `Dice`,
	"EDIT": `Edit`,
	"EMBED": `Embed`,
	"FROM": `From`, // context: we are changing a value "from" something "to" something else
	"GAME": `Game`,
	"GAMES": `Games`,
	"GLOBAL": `Global`,
	"IMPORT": `Import`,
	"ITEMS": `Items`,
	"MACRO": "Macro",
	"MACROS": "Macros",
	"MATH": `Math`,
	"MINION": "Minion",
	"NAME": `Name`,
	"NEW": `New`,
	"NO": `No`, // context: for a "yes" or "no" confirmation prompt
	"NOTE": `Note`,
	"NPC": "NPC",
	"OWNERS": `Owners`,
	"PAGE": `Page`,
	"PC": "PC",
	"REIMPORT": `Reimport`,
	"RESET": `Reset`,
	"ROLL": `Roll`,
	"SERVER": `Server`,
	"SERVERS": `Servers`,
	"SHARE": `Share`,
	"TABLE": `Table`,
	"TO": `To`, // context: we are changing a value "from" something "to" something else
	"UNCATEGORIZED": `Uncategorized`,
	"UPDATE": `Update`,
	"USAGE": `Usage`,
	"USER": `User`,
	"USERS": `Users`,
	"WARNING": `Warning`,
	"YES": `Yes`, // context: for a "yes" or "no" confirmation prompt

	"RPG_SAGE_THINKING": `RPG Sage is thinking ...`,
	"PLEASE_WAIT": `Please wait ...`,
	"PLEASE_DONT_USE_CONTROLS": `Please don't use another user's controls.`,

	"COMMAND_NOT_VALID": `The command you attempted is ***NOT*** valid.`,

	"NONE_FOUND": `None found.`,

	"TABLE_URL": `Table Url`,
	"UNKNOWN": `Unknown`,
	"NONE": `None`,

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

	"IMPORT_CHARACTERS_WIKI": `For information about importing characters, see our [wiki](<#{0}>)`,
	"REIMPORT_CHARACTERS_WIKI": `For information on reimporting characters, see our [wiki](<#{0}>)`,

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

	"X_OF_Y": `#{0} of #{1}`,
	"PAGE_X_OF_Y": `Page #{0} of #{1}`,

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
	"MACRO_TYPE_LIST": `Macro Type List`,
	"MACRO_OWNER_LIST": `Macro Owner List`,
	"MACRO_S_NOT_FOUND": `Macro "#{0}" ***NOT*** found!`,
	"NO_MACROS_FOUND": `No Macros Found!`,
	"TO_VIEW_MACRO_USE_:": `To view a macro, use:`,
	"TO_CREATE_MACRO_USE_:": `To create a macro, use:`,

	"SELECT_MACRO_TYPE": `Select Macro Type ...`,
	"SELECT_A_MACRO": `Select a Macro ...`,
	"CHARACTER_MACROS": `Character Macros`,
	"USER_MACROS": `User Macros`,
	"GAME_MACROS": `Game Macros`,
	"SERVER_MACROS": `Server Macros`,
	"GLOBAL_MACROS": `Global Macros`,


	"INVALID_MACRO_NAME": `Macro names should only contain letters, numbers, spaces, underscores, and dashes.`,
	"INVALID_MACRO_DUPLICATE": `There is already a macro with that name.`,
	"INVALID_MACRO_DIALOG": `Your macro dialog is invalid.`,
	"INVALID_MACRO_DICE": `Your macro dice is invalid.`,
	"INVALID_MACRO_TABLE": `Your macro table is invalid.`,
	"MACROS_WIKI": `For information about macros, see our [wiki](<#{0}>).`,

	"CREATE_CHARACTER_MACRO": `Create Character Macro`,
	"CREATE_USER_MACRO": `Create User Macro`,
	"CREATE_GAME_MACRO": `Create Game Macro`,
	"CREATE_SERVER_MACRO": `Create Server Macro`,
	"CREATE_GLOBAL_MACRO": `Create Global Macro`,

	"EDIT_CHARACTER_MACRO": `Edit Character Macro`,
	"EDIT_USER_MACRO": `Edit User Macro`,
	"EDIT_GAME_MACRO": `Edit Game Macro`,
	"EDIT_SERVER_MACRO": `Edit Server Macro`,
	"EDIT_GLOBAL_MACRO": `Edit Global Macro`,

	"MACRO_NAME_PLACEHOLDER": `Macro names can only be letters and numbers.`,
	"MACRO_CATEGORY_PLACEHOLDER": `Macro categories group related macros together.`,
	"MACRO_TABLE_PLACEHOLDER": `The table you wish to roll on or the URL to the table.`,
	"MACRO_ITEMS_PLACEHOLDER": `The items you wish to randomly select from.`,
	"MACRO_DIALOG_PLACEHOLDER": `The dialog you wish to send, ex: pc::{name}::**"Quoted bold dialog."**`,
	"MACRO_DICE_PLACEHOLDER": `The dice you wish to roll, ex: [1d20 attack; 1d6 damage]`,

	"CREATE_MACRO_?": `Create Macro?`,

	"PROMPT_ROLL": `Prompt Roll`,

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

	"SAGE_MISSING_S_PERM_IN_THAT_CHANNEL": `RPG Sage doesn't appear to have the #{0} permission in that channel.`,
	"SAGE_MISSING_ACCESS_TO_THAT_CHANNEL": `RPG Sage doesn't appear to have access to that channel.`,
	"WE_TRIED_TO_DM_YOU": `We tried to DM this alert to you, but were unable to.`,

	"WARNING_CANNOT_BE_UNDONE": `Warning, this action cannot be undone!`,
	//#region map specific
	"REPLY_TO_MAP_TO_MOVE": `Please reply to the map you wish to move your token on.`,
	"REPLY_TO_MAP_TO_ACTIVATE": `Please reply to the map you wish to set your active token for.`,
	"INCLUDE_MOVE_DIRECTIONS": `Please include the directions you wish to move your token.`,
	"FOR_EXAMPLE:": `For example:`,
	"PROBLEM_LOADING_MAP": `Sorry, there was a problem loading your map!`,
	"UNABLE_TO_FIND_AURA_S": `Unable to find aura: #{0}`,
	"UNABLE_TO_FIND_TOKEN_S": `Unable to find token: #{0}`,
	"UNABLE_TO_FIND_TERRAIN_S": `Unable to find terrain: #{0}`,
	"NO_IMAGE_TO_MOVE": `You have no image to move!`,
	"NO_IMAGE_TO_ACTIVATE": `You have no image to activate!`,
	"MOVE_S_S_?": `Move #{0} #{1} ?`,
	"MOVING_S_S": `Moving #{0} #{1} ...`,
	"ERROR_MOVING_IMAGE": `Error moving image!`,
	"NO_IMAGE_TO_DELETE": `You have no image to delete!`,
	"DELETE_IMAGE_S_?": `Delete image: #{0} ?`,
	"DELETING_IMAGE_S": `Deleting image: #{0} ...`,
	"DELETED_IMAGE_S": `Deleted image: #{0}`,
	"ERROR_DELETING_IMAGE": `Error deleting image!`,
	"ERROR_MANIPULATING_IMAGE": `Error manipulating image!`,
	"NOT_IMPLEMENTED_YET": `Not implemented ... yet.`,
	"ONLY_MAP_OWNERS": `Only map owners can do that!`,
	"ONLY_MAP_OWNERS_OR_GAMEMASTERS": `Only map owners or game masters can do that!`,
	"DECREASING_AURA_OPACITY_S": `Decreasing aura opacity: #{0} ...`,
	"INCREASING_AURA_OPACITY_S": `Increasing aura opacity: #{0} ...`,
	"LOWERING_TERRAIN_S": `Lowering terrain: #{0} ...`,
	"RAISING_TERRAIN_S": `Raising terrain: #{0} ...`,
	"LOWERING_TOKEN_S": `Lowering token: #{0} ...`,
	"RAISING_TOKEN_S": `Raising token: #{0} ...`,
	"SET_S_AS_ACTIVE_?": `Set #{0} as active?`,
	"SETTING_S_AS_ACTIVE": `Setting #{0} as active ...`,
	"SETTING_ACTIVE_AURA_FOR_S_TO_S": `Setting active aura for #{0} to #{1} ...`,
	"YOUR_ACTIVE_AURA_FOR_S_IS_S": `Your active aura for #{0} is: #{1}`,
	"YOUR_ACTIVE_TOKEN_IS_S": `Your active token is: #{0}`,
	"YOUR_ACTIVE_TERRAIN_IS_S": `Your active terrain is: #{0}`,
	"ERROR_SETTING_ACTIVE_TOKEN": `Error setting active token!`,
	"ERROR_SETTING_ACTIVE_TERRAIN": `Error setting active terrain!`,
	"ERROR_SETTING_ACTIVE_AURA": `Error setting active aura!`,
	"ERROR_SETTING_ACTIVE_IMAGE": `Error setting active image!`,
	// "ADDING_TOKEN_FOR_S": `Adding token for #{0} ...`,
	// "LINKING_TOKEN_FOR_S": `Linking token for #{0} ...`,
	//#endregion
};

export type LocalizedTextKey = keyof typeof enUS;

const all = {
	"en-US": enUS,
};

export type Lang = keyof typeof all;

type Arg = Optional<string | number>;

export type Localizer = (key: LocalizedTextKey, ...args: Arg[]) => string;

/*
Ideas from https://www.i18next.com/translation-function/plurals
Allow options: { count:number; ordinal?:true; context:string; }
if (count) then look up key_count; ex: USER_ONE:"User", USER_OTHER:"Users"
if (count && ordinal) then use nth(count) as the first arg; ex: NTH_PLACE:"#{0} place"
if (context) then use key_context; ex: CHAR:"Character", CHAR_PC:"Player Character"
*/

export function getLocalizedText(key: LocalizedTextKey, lang: Lang, ...args: Arg[]): string {
	const text = all[lang]?.[key] ?? enUS[key];

	if (key.endsWith("_WIKI") && !args.length) {
		const wikiUrlKey = key.slice(0, -5);
		if (hasWikiUrl(wikiUrlKey)) {
			args = [getWikiUrl(wikiUrlKey)];
		}
	}

	return stringFormat(text, ...args);
}

export function hasLocalizedText(key: string): key is LocalizedTextKey {
	return key in enUS;
}