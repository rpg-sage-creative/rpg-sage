import type { Color } from "@rsc-utils/color-utils";
import { createMessageEmbed } from "../../../discord/createMessageEmbed.js";

export function embedColor(color: Color, ...labels: string[]) {
	let desc = color.hex;
	if (color.name) {
		desc += ` "${color.name}"`;
	}
	if (labels.length) {
		desc += ` ${labels.join(" ")}`;
	}
	return createMessageEmbed({
		color: color.hex,
		description: desc
	});
}
