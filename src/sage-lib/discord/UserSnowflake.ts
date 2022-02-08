import type * as Discord from "discord.js";
import DiscordId from "./DiscordId";

export default class UserSnowflake {
	public static isUserMention(value: string): boolean {
		return DiscordId.isUserMention(value);
	}
	public static toUserMention(did: Discord.Snowflake): string | null {
		return DiscordId.toUserMention(did);
	}

	public static resolve(resolvable: string | Discord.Snowflake | Discord.User | Discord.Message | Discord.GuildMember): Discord.Snowflake | null {
		if (resolvable) {
			if (typeof(resolvable) === "string") {
				if (DiscordId.isValidId(resolvable)) {
					return resolvable;
				}
				if (UserSnowflake.isUserMention(resolvable)) {
					return DiscordId.parseId(resolvable);
				}
			}else {
				if ("author" in resolvable) {
					return resolvable.author.id;
				}else if ("id" in resolvable) {
					return resolvable.id;
				}
			}
		}
		return null;
	}
}
