import { EmbedBuilder, wrapUrl } from "@rsc-utils/discord-utils";
import type { GameCharacter } from "../../../../model/GameCharacter.js";

function createImageEmbed(key: "Token" | "Avatar", imageUrl: string): EmbedBuilder {
	return new EmbedBuilder()
		.setThumbnail(imageUrl)
		.setDescription(`**${key}**\n- ${wrapUrl(imageUrl)}`);
}

function getImagesEmbeds(char: GameCharacter): EmbedBuilder[] {
	const embeds: EmbedBuilder[] = [];
	if (char.tokenUrl) embeds.push(createImageEmbed("Token", char.tokenUrl));
	if (char.avatarUrl) embeds.push(createImageEmbed("Avatar", char.avatarUrl));
	return embeds;
}

type Results = { content:string; embeds:EmbedBuilder[]; isEmpty:boolean; };
export function getImagesContent(char: GameCharacter): Results {
	const lines = [
		`### Images`,
	];
	let empty = true;
	if (char.tokenUrl) {
		lines.push(`> **Token** ${wrapUrl(char.tokenUrl)}`);
		empty = false;
	}
	if (char.avatarUrl) {
		lines.push(`> **Avatar** ${wrapUrl(char.avatarUrl)}`);
		empty = false;
	}
	if (empty) {
		lines.push(`> *none*`);
	}
	return {
		content: lines.join("\n"),
		embeds: getImagesEmbeds(char),
		isEmpty: lines.length === 0
	};
}
