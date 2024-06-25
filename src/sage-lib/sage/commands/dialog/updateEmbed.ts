import type { Optional } from "@rsc-utils/core-utils";
import { EmbedBuilder } from "@rsc-utils/discord-utils";
import type { Embed } from "discord.js";

export function updateEmbed(originalEmbed: Embed | undefined, imageUrl: Optional<string>, content: string): EmbedBuilder {
	const updatedEmbed = new EmbedBuilder(originalEmbed?.toJSON());
	updatedEmbed.setDescription(content);
	if (imageUrl) {
		updatedEmbed.setThumbnail(imageUrl);
	}
	// updatedEmbed.setThumbnail(imageUrl ?? originalEmbed?.thumbnail?.url ?? "");
	// updatedEmbed.setColor(originalEmbed?.color);
	return updatedEmbed;
}