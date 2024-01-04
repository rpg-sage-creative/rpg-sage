import { ColorResolvable, MessageEmbed } from "discord.js";
import { Optional } from "../../../../sage-utils";

export function updateEmbed(originalEmbed: MessageEmbed | undefined, title: Optional<string>, imageUrl: Optional<string>, content: string): MessageEmbed {
	const updatedEmbed = new MessageEmbed();
	updatedEmbed.setTitle(title ?? originalEmbed?.title ?? "");
	updatedEmbed.setDescription(content);
	updatedEmbed.setThumbnail(imageUrl ?? originalEmbed?.thumbnail?.url ?? "");
	updatedEmbed.setColor(originalEmbed?.color as ColorResolvable);
	return updatedEmbed;
}