import type { Snowflake } from "discord.js";

export const DiscordMaxValues = {
	embed: {
		titleLength: 256,
		descriptionLength: 2048,
		field: {
			count: 25,
			nameLength: 256,
			valueLength: 1024
		},
		footerTextLength: 2048,
		authorNameLength: 256,
		totalLength: 6000
	},
	message: {
		contentLength: 2000,
		embedCount: 10,
		fileCount: 10,
		reactionCount: 20
	},
	usernameLength: 80
};

export const NilSnowflake: Snowflake = "0000000000000000";
