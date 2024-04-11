import { DiceCritMethodType, DiceOutputType, GameType } from "@rsc-sage/types";
import { getEnumKeys } from "@rsc-utils/enum-utils";
import type { SlashCommand } from "../../types.js";

function getCreateUpdateOptions(isUpdate: boolean) {
	const options = [
		{ name:"name", isRequired:!isUpdate },
		{ name:"system", description:"Game System, ex: PF2e or DnD5e", choices:getEnumKeys(GameType) },
		{ name:"ic", description:"In Character Channel" },
		{ name:"ooc", description:"Out of Character Channel" },
		{ name:"gm", description:"GM Only Channel" },
		{ name:"misc", description:"Misc Channel" },
		{ name:"gms", description:"Game Masters" },
		{ name:"players", description:"Players" },
		{ name:"dialogPost", choices:["Embed", "Post"] },
		{ name:"gmCharName", description:"Game Master Character Name" },
		{ name:"diceCrit", choices:getEnumKeys(DiceCritMethodType), description:"Critical Hit Method, ex: RollTwice, TimesTwo" },
		{ name:"diceOutput", choices:getEnumKeys(DiceOutputType) },
		{ name:"dicePost", choices:["Ignore", "Hide", { name:"GM Channel", value:"GameMasterChannel" }, { name:"GM Message", value:"GameMasterDirect" }] },
		{ name:"diceSecret", choices:[{ name:"Post", value:"SinglePost" }, { name:"Embed", value:"SingleEmbed" }] },
	];
	if (isUpdate) {
		options.push({ name:"remove", description:"Channels or Users to Remove from the Game" });
	}
	return options;
}

export function registerCommand(): SlashCommand {
	return {
		name: "Game",
		children: [
			{
				name: "Create",
				description: "Create a new RPG Sage Game",
				options: getCreateUpdateOptions(false),
			},
			{
				name: "Details",
				description: "View an RPG Sage Game",
			},
			{
				name: "Update",
				description: "Update an RPG Sage Game",
				options: getCreateUpdateOptions(true),
			},
			{
				name: "Archive",
				description: "Archive an RPG Sage Game",
			}
		]
	};
}