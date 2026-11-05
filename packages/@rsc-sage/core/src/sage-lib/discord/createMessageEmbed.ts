import { isWrapped, unwrap, type HexColorString } from "@rsc-utils/core-utils";
import { DiscordMaxValues, EmbedBuilder } from "@rsc-utils/discord-utils";
import { isUrl } from "@rsc-utils/io-utils";
import { Logger } from "@rsc-utils/logger-utils";

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
			Logger.package("@rsc-sage/core").warn(`MessageEmbed.title too long (${title.length}/${titleLength}): ${title}`);
			title = title.slice(0, titleLength);
		}
		embed.setTitle(title);
	}

	if (description) {
		if (description.length > descriptionLength) {
			Logger.package("@rsc-sage/core").warn(`MessageEmbed.description too long (${description.length}/${descriptionLength}): ${description}`);
			description = description.slice(0, descriptionLength);
		}
		embed.setDescription(description);
	}

	if (color) {
		if (color.startsWith("0x")) {
			Logger.package("@rsc-sage/core").warn(`Unexpected MessageEmbed.color: ${color}`);
			color = `#${color.slice(2)}`;
		}
		embed.setColor(color);
	}

	if (thumbnailUrl) {
		if (isUrl(thumbnailUrl)) {
			if (isWrapped(thumbnailUrl, "<>")) {
				Logger.package("@rsc-sage/core").warn(`MessageEmbed.thumbnail wrapped: ${thumbnailUrl}`);
				thumbnailUrl = unwrap(thumbnailUrl, "<>");
			}
			embed.setThumbnail(thumbnailUrl);
		}else {
			Logger.package("@rsc-sage/core").warn(`MessageEmbed.thumbnail invalid: ${thumbnailUrl}`);
		}
	}

	return embed;
}
