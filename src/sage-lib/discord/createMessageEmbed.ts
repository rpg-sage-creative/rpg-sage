import { warn } from "@rsc-utils/core-utils";
import { DiscordMaxValues, EmbedBuilder } from "@rsc-utils/discord-utils";
import { type ColorResolvable } from "discord.js";

type Options = {
	title?: string | null;
	description?: string | null;
	color?: string | null;
};

/** Creates a new MessageEmbed, setting the title, description, and color if given. */
export function createMessageEmbed({ title, description, color }: Options = { }): EmbedBuilder {
	const embed = new EmbedBuilder();

	if (title) {
		if (title.length > DiscordMaxValues.embed.titleLength) {
			warn(`MessageEmbed.title too long (${title.length}/${DiscordMaxValues.embed.titleLength}): ${title}`);
			title = title.slice(0, DiscordMaxValues.embed.titleLength);
		}
		embed.setTitle(title);
	}

	if (description) {
		if (description.length > DiscordMaxValues.embed.descriptionLength) {
			warn(`MessageEmbed.description too long (${description.length}/${DiscordMaxValues.embed.descriptionLength}): ${description}`);
			description = description.slice(0, DiscordMaxValues.embed.descriptionLength);
		}
		embed.setDescription(description);
	}

	if (color) {
		embed.setColor(color as ColorResolvable);
	}

	return embed;
}
