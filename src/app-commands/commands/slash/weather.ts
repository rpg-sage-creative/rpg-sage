import type { SlashCommand } from "../../types.js";

export function registerCommand(): SlashCommand {
	return {
		name: "Weather",
		description: "Create random weather reports.",
		options: [
			{ name:"climate", description:"Cold, Temperate, Tropical", choices:["Cold", "Temperate", "Tropical"] },
			{ name:"elevation", description:"SeaLevel, Lowland, Highland", choices:["SeaLevel", "Lowland", "Highland"] },
			{ name:"season", description:"Temperate: Spring, Summer, Fall, Winter; Tropical: Wet, Dry", choices:["Spring", "Summer", "Fall", "Winter", "Wet", "Dry"] }
		]
	};
}