import { type Embed, type APIEmbed, type JSONEncodable } from "discord.js";
import { type EmbedBuilder } from "./EmbedBuilder.js";

export type EmbedResolvable = Embed | APIEmbed | EmbedBuilder | JSONEncodable<APIEmbed>;