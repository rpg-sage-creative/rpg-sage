import type { MessageEmbed, MessageEmbedOptions } from "discord.js";
import type { APIEmbed } from "discord-api-types/v9";

export type EmbedResolvable = MessageEmbed | MessageEmbedOptions | APIEmbed;