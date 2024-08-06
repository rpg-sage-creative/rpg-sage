import { DiscordMaxValues, EmbedBuilder } from "@rsc-utils/discord-utils";
import type { GameCharacter } from "../../../../model/GameCharacter.js";

export function getStatsEmbed(char: GameCharacter): EmbedBuilder {
	const regex = /^(level|hp|maxhp|conditions)$/i;
	const others = char.notes.getStats()
		.filter(stat => !regex.test(stat.title))
		.map(stat => `${stat.title}="${stat.note}"`);

	const embed = new EmbedBuilder();
	embed.appendDescription(`**Character Level** *(level)*: ${char.getStat("level") ?? `*unset*`}`, "\n");
	embed.appendDescription(`**Current Hit Points** *(hp)*: ${char.getStat("hp") ?? `*unset*`}`, "\n");
	embed.appendDescription(`**Maximum Hit Points** *(maxHp)*: ${char.getStat("maxHp") ?? `*unset*`}`, "\n");
	embed.appendDescription(`**Conditions** *(conditions)*: ${char.getStat("conditions") ?? `*unset*`}`, "\n");
	if (others.length) {
		embed.appendDescription(`**Other Stats**:`, "\n");
		for (const other of others) {
			if (embed.length + other.length < DiscordMaxValues.embed.descriptionLength) {
				embed.appendDescription(other, "\n");
			}else {
				break;
			}
		}
	}else {
		embed.appendDescription(`**Other Stats**: *none*`, "\n");
	}
	return embed;
}
