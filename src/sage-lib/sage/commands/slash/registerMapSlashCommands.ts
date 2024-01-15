import { registerSlashCommand } from "../../../../slash.mjs";
import type { TSlashCommand } from "../../../../SlashTypes";

function mapCommand(): TSlashCommand {
	const isNumber = true;
	const isRequired = true;
	return {
		name: "Map",
		description: "Map Commands",
		children: [
			// {
			// 	name: "Create",
			// 	description: "Sets the map for this channel.",
			// 	options: [
			// 		{ name:"url", description:"Url to the map image.", isRequired },
			// 		{ name:"name", description:"What do you call this map?", isRequired },
			// 		{ name:"cols", description:"How many columns on this map?", isNumber, isRequired },
			// 		{ name:"rows", description:"How many rows on this map?", isNumber, isRequired },
			// 		{ name:"spawn", description:"Grid location to spawn new images. Default: 1,1 " },
			// 		{ name:"clip", description:"(Advanced) How to clip map's source image: dx,dY,dW,dH" }
			// 	]
			// },
			{
				name: "AddImage",
				description: "Adds an image to a map",
				options: [
					{ name:"map", description:"Map Id?", isRequired, },
					{ name:"layer", description:"Which map layer?", isRequired, choices:["aura","terrain","token"] },
					{ name:"url", description:"Url to the token image.", isRequired },
					{ name:"name", description:"What/Who is this image?", isRequired },
					{ name:"cols", description:"How many columns wide is this image?", isNumber, isRequired },
					{ name:"rows", description:"How many rows tall is this image?", isNumber, isRequired },
					{ name:"col", description:"Column # (starting with 1) to place this image's top left corner.", isNumber, isRequired },
					{ name:"row", description:"Row # (starting with 1) to place this image's top left corner.", isNumber, isRequired }
				]
			}
		]
	};
}

export function registerMapSlashCommands(): void {
	registerSlashCommand(mapCommand());
}
