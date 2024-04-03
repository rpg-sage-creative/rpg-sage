import { DialogPostType, DiceCritMethodType, DiceOutputType, DicePostType, DiceSecretMethodType, GameType } from "@rsc-sage/types";
import { getEnumKeys } from "@rsc-utils/enum-utils";
import type { SlashCommand } from "../../types.js";

export function registerCommand(): SlashCommand {
	const systemOption = { name:"system", description:"Game System, ex: PF2e or DnD5e", choices:getEnumKeys(GameType) };

	const dialogPostOption = { name:"dialogPost", choices:getEnumKeys(DialogPostType) };

	const diceCritOption = { name:"diceCrit", choices:getEnumKeys(DiceCritMethodType), description:"Critical Hit Method, ex: RollTwice, TimesTwo" };
	const diceOutputOption = { name:"diceOutput", choices:getEnumKeys(DiceOutputType) };
	const dicePostOption = { name:"dicePost", choices:getEnumKeys(DicePostType) };
	const diceSecretOption = { name:"diceSecret", choices:getEnumKeys(DiceSecretMethodType) };

	return {
		name: "Game",
		children: [
			{
				name: "Create",
				description: "Creates a new RPG Sage Game",
				options: [
					{ name:"name", isRequired:true },
					systemOption,
					{ name:"ic", description:"In Character Channel" },
					{ name:"ooc", description:"Out of Character Channel" },
					{ name:"gm", description:"GM Only Channel" },
					{ name:"misc", description:"Misc Channel" },
					{ name:"gms", description:"Game Masters" },
					{ name:"players", description:"Players" },
					dialogPostOption,
					{ name:"gmCharName", description:"Game Master Character Name" },
					diceCritOption,
					diceOutputOption,
					dicePostOption,
					diceSecretOption
				]
			},
			{
				name: "Update",
				description: "Updates an RPG Sage Game",
				options: [
					{ name:"name" },
					systemOption,
					dialogPostOption,
					{ name:"gmCharName", description:"Game Master Character Name" },
					diceCritOption,
					diceOutputOption,
					dicePostOption,
					diceSecretOption
				]
			}
		]
	};
}