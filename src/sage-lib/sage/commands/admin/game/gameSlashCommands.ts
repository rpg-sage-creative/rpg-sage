import { getEnumKeys } from "@rsc-utils/enum-utils";
import type { TSlashCommand } from "../../../../../SlashTypes.js";
import { GameType } from "../../../../../sage-common/index.js";
import { registerSlashCommand } from "../../../../../slash.mjs";
import { DialogType } from "../../../repo/base/IdRepository.js";
import { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../../../sage-dice/common.js";
import { DicePostType } from "../../dice.js";

function gameCreateCommand(): TSlashCommand {
	const gameTypeOption = { name:"gameType", description:"Game System, ex: PF2e or DnD5e", choices:getEnumKeys(GameType) };
	const dialogTypeOption = { name:"dialogType", choices:getEnumKeys(DialogType) };
	const critMethodOption = { name:"critMethod", choices:getEnumKeys(CritMethodType) };
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
					gameTypeOption,
					{ name:"ic", description:"In Character Channel" },
					{ name:"ooc", description:"Out of Character Channel" },
					{ name:"gm", description:"GM Only Channel" },
					{ name:"misc", description:"Misc Channel" },
					{ name:"gms", description:"Game Masters" },
					{ name:"players", description:"Players" },
					dialogTypeOption,
					critMethodOption,
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
					gameTypeOption,
					dialogTypeOption,
					critMethodOption,
					diceOutputOption,
					dicePostOption,
					diceSecretOption
				]
			}
		]
	};
}

export function registerGameSlashCommands(): void {
	registerSlashCommand(gameCreateCommand());
}