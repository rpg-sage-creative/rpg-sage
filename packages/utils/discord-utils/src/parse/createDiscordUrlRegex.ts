import { RegExpCreateOptions, wrap } from "@rsc-utils/string-utils";

// dm message
// https://discord.com/channels/@me/654449179493400649/1199781308537262212

// channel
// https://discord.com/channels/480488957889609733/1182487240534937610

// message
// https://discord.com/channels/480488957889609733/1182487240534937610/1192628934014140476
// attachment
//          https://cdn.discordapp.com/attachments/1182487240534937610/1192628933758292090/image.png?ex=65bc3a3f&is=65a9c53f&hm=ac65b806015a13607731cf8615be4f408621d95ab449f69b907d552611528411&

// message
// https://discord.com/channels/480488957889609733/1182487240534937610/1192629622005842040
// attachment
//          https://cdn.discordapp.com/attachments/1182487240534937610/1192629621783535626/image.png?ex=65bc3ae3&is=65a9c5e3&hm=89f732c8e70c8b2f4fa6c0367bb992b7b4b40521269c53531dedf5f623019df9&

type UrlType = "channel" | "message";

/** @internal @private */
export function createDiscordUrlRegex(type: UrlType, options?: RegExpCreateOptions): RegExp {
	const capture = options?.capture;
	const flags = options?.globalFlag ? "gi" : "i";

	let regex = "";
	switch(type) {
		case "channel":
			regex = /https:\/\/discord\.com\/channels\/(?<guildId>@me|\d{16,})\/(?<channelId>\d{16,})(?![/\d])/.source;
			break;
		case "message":
			regex = /https:\/\/discord\.com\/channels\/(?<guildId>@me|\d{16,})\/(?<channelId>\d{16,})\/(?<messageId>\d{16,})/.source;
			break;
	}

	if (!options?.globalFlag) {
		regex = wrap(regex, "^$");
	}

	if (capture) {
		if (capture === true) {
			return new RegExp(`(${regex})`, flags);
		}
		return new RegExp(`(?<${capture}>${regex})`, flags);
	}
	return new RegExp(regex, flags);
}
