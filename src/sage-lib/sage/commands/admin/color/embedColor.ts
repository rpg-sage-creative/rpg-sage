import type { Color } from "@rsc-utils/color-utils";
import { MessageEmbed } from "discord.js";

export function embedColor(color: Color, ...labels: string[]): MessageEmbed {
	const embed = new MessageEmbed();
	embed.setColor(<any>color.toDiscordColor());
	let desc = color.hex;
	if (color.name) {
		desc += ` "${color.name}"`;
	}
	if (labels.length) {
		desc += ` ${labels.join(" ")}`;
	}
	embed.setDescription(desc);
	return embed;
}
