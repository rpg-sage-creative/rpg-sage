import type { APIEmbed } from "discord-api-types/v9";
import type { MessageEmbed, MessageEmbedOptions } from "discord.js";

export type EmbedResolvable = MessageEmbed | MessageEmbedOptions | APIEmbed;