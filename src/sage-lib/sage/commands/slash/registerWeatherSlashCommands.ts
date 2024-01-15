import { registerSlashCommand } from "../../../../slash.mjs";
import type { TSlashCommand } from "../../../../SlashTypes";

function weatherCommand(): TSlashCommand {
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

export function registerWeatherSlashCommands(): void {
	registerSlashCommand(weatherCommand());
}
