import { warn } from "@rsc-utils/core-utils";
import { DiscordMaxValues, EmbedBuilder } from "@rsc-utils/discord-utils";
import { isUrl } from "@rsc-utils/io-utils";
import { isWrapped, unwrap } from "@rsc-utils/string-utils";
import type { HexColorString } from "discord.js";

type Options = {
	title?: string | null;
	description?: string | null;
	color?: HexColorString | null;
	thumbnailUrl?: string | null;
};

/** Creates a new MessageEmbed, setting the title, description, and color if given. */
export function createMessageEmbed({ title, description, color, thumbnailUrl }: Options = { }): EmbedBuilder {
	const embed = new EmbedBuilder();

	const { titleLength, descriptionLength } = DiscordMaxValues.embed;

	if (title) {
		if (title.length > titleLength) {
			warn(`MessageEmbed.title too long (${title.length}/${titleLength}): ${title}`);
			title = title.slice(0, titleLength);
		}
		embed.setTitle(title);
	}

	if (description) {
		if (description.length > descriptionLength) {
			warn(`MessageEmbed.description too long (${description.length}/${descriptionLength}): ${description}`);
			description = description.slice(0, descriptionLength);
		}
		embed.setDescription(description);
	}

	if (color) {
		if (color.startsWith("0x")) {
			warn(`Unexpected MessageEmbed.color: ${color}`);
			color = `#${color.slice(2)}`;
		}
		embed.setColor(color);
	}

	if (thumbnailUrl) {
		if (isUrl(thumbnailUrl)) {
			if (isWrapped(thumbnailUrl, "<>")) {
				warn(`MessageEmbed.thumbnail wrapped: ${thumbnailUrl}`);
				thumbnailUrl = unwrap(thumbnailUrl, "<>");
			}
			embed.setThumbnail(thumbnailUrl);
		}else {
			warn(`MessageEmbed.thumbnail invalid: ${thumbnailUrl}`);
		}
	}

	return embed;
}
