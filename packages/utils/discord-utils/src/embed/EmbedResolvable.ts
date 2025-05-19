import type { APIEmbed, Embed, JSONEncodable } from "discord.js";
import type { EmbedBuilder } from "./EmbedBuilder.js";

export type EmbedResolvable = Embed | APIEmbed | EmbedBuilder | JSONEncodable<APIEmbed>;