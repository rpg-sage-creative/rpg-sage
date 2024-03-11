import { sortByKey } from "@rsc-utils/array-utils";
import type { SlashCommand } from "../../types.js";

export function registerCommand(): SlashCommand {
	const command = {
		name: "Help",
		description: "Get basic Help for RPG Sage.",
		options: [
			{ name:"category", description:"What do you need help with?", choices:[
				{ name:"Search", value:"search", description:"Learn how find and search work!" },

				// Admin
				{ name:"Game Management", value:"admin,game", description:"Learn how to manage RPG Sage games." },
				{ name:"Game GM Management", value:"admin,gm", description:"Learn how to manage RPG Sage game masters." },
				{ name:"Game Player Management", value:"admin,player", description:"Learn how to manage RPG Sage players." },
				{ name:"NPC Management", value:"admin,npc", description:"Learn how to manage RPG Sage non-player characters." },
				{ name:"PC Management", value:"admin,pc", description:"Learn how to manage RPG Sage player characters." },
				{ name:"PC Stats Management", value:"admin,stats", description:"Learn how to manage RPG Sage character stats." },
				{ name:"PC/NPC Companion Management", value:"admin,companion", description:"Learn how to manage RPG Sage companions." },
				{ name:"Channel Management", value:"admin,channel", description:"Learn how to manage RPG Sage channel settings." },
				{ name:"Color Management", value:"admin,color", description:"Learn how to manage RPG Sage colors." },
				{ name:"Emoji Management", value:"admin,emoji", description:"Learn how to manage RPG Sage emoji." },
				{ name:"Server Management", value:"admin,server", description:"Learn how to manage RPG Sage server wide settings." },
				{ name:"Sage Admin Management", value:"admin,admin", description:"Learn how to manage RPG Sage admins." },
				{ name:"Sage Prefix Management", value:"admin,prefix", description:"Learn how to manage RPG Sage's command prefix" },
				// { name:"superuser", description:"superuser" }

				// Command
				{ name:"PF2e DC Values", value:"command,dcs", description:"Quickly find the DC you are looking for!" },
				{ name:"Golarion Calendar Info", value:"command,golarion", description:"Learn the names of Days or Months on Golarion!" },
				{ name:"Random Weather Report", value:"command,weather", description:"Learn how to create a random weather report!" },

				// Dialog
				{ name:"Dialog Commands", value:"dialog", description:"Learn how to use Sage's dialog feature!" },

				// Dice
				{ name:"Dice Commands", value:"dice,basic", description:"Learn how to use Sage's dice roller!" },
				{ name:"PF2e Dice Commands", value:"dice,pf2e", description:"Learn Sage expands dice for PF2e!" },
				{ name:"Dice Macros", value:"macro", description:"Learn how to use Sage's dice macros!" },

				// Lists (lists)

				// PFS
				{ name:"PFS Commands", value:"pfs", description:"Income Roller, Scenario Randomize, Tier Calculator" },

				// Spells
				{ name:"Spells Lists", value:"spells", description:"Learn how to filter or list spells in different ways!" },

				// Wealth
				{ name:"Wealth", value:"wealth", description:"Coin Counter, Income Earned, Starting Income" }
			] }
		]
	};
	// command.options[0].choices.forEach(choice => delete choice.description);
	command.options[0].choices.sort(sortByKey("name"));
	return command;
}