import { isDefined } from "@rsc-utils/core-utils";
import { DiscordMaxValues, EmbedBuilder, getTotalEmbedLength } from "@rsc-utils/discord-utils";
import { chunk } from "@rsc-utils/string-utils";
import type { GameCharacter } from "../../../../model/GameCharacter.js";

function getResultEmbeds(content: string, currentEmbedLength: number): EmbedBuilder[] {
	const { totalLength, descriptionLength } = DiscordMaxValues.embed;
	const maxLength = totalLength - currentEmbedLength;
	if (maxLength < 0) return [];

	const embeds: EmbedBuilder[] = [];
	const chunks = chunk(content, Math.min(maxLength, descriptionLength));
	for (const chunk of chunks) {
		const embed = new EmbedBuilder().setDescription(chunk);
		if (currentEmbedLength + embed.length < totalLength) {
			embeds.push(embed);
		}
	}
	return embeds;
}

type Result = { content:string; isEmpty:boolean; embeds:EmbedBuilder[]; };
function getResult(label: string, list: string[], currentEmbedLength: number): Result {
	const headerString = `**${label} Stats**`;
	const contentString = list.join("\n");
	const content = `${headerString}\n${label === "Common" ? "" : ">>> "}${contentString}`;
	const embeds = getResultEmbeds(`### ${headerString}\n${contentString}`, currentEmbedLength);
	const isEmpty = list.length === 0;
	return { content, embeds, isEmpty };
}

type Results = { isEmpty: boolean; common: Result; other: Result; };
/**
 * Uses currentEmbedLength to ensure we don't create stats embeds that break the max total embed length number
 * @param char charater to get stats for
 * @param currentEmbedLength total length of all embeds already being displayed
 * @returns
 */
export function getStatsContent(char: GameCharacter, currentEmbedLength: number): Results {
	const commonLabels = ["Level", "Hit Points", "Max Hit Points", "Conditions"];
	const commonStats = ["level", "hp", "maxHp", "conditions"];
	const commonList = commonStats
		.filter(key => isDefined(char.getStat(key)))
		.map((key, i) => `> **${commonLabels[i]}**: ${char.getStat(key)}`);
	const common = getResult("Common", commonList, currentEmbedLength);

	currentEmbedLength += getTotalEmbedLength(common.embeds);

	const commonRegex = new RegExp(`^(${commonStats.join("|")})$`, "i");
	const otherList = char.notes.getStats()
		.filter(stat => !commonRegex.test(stat.title))
		.map(stat => `${stat.title}="${stat.note}"`);
	const other = getResult("Other", otherList, currentEmbedLength);

	const isEmpty = common.isEmpty && other.isEmpty;

	return { common, other, isEmpty };
}
