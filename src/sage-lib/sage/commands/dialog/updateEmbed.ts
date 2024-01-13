import { Optional } from "@rsc-utils/type-utils";
import { ColorResolvable, MessageEmbed } from "discord.js";

export function updateEmbed(originalEmbed: MessageEmbed | undefined, imageUrl: Optional<string>, content: string): MessageEmbed {
	const updatedEmbed = new MessageEmbed();
	updatedEmbed.setDescription(content);
	updatedEmbed.setThumbnail(imageUrl ?? originalEmbed?.thumbnail?.url ?? "");
	updatedEmbed.setColor(originalEmbed?.color as ColorResolvable);
	return updatedEmbed;
}