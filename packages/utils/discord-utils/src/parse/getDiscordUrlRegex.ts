import { getOrCreateRegex, type RegExpAnchorOptions, type RegExpCaptureOptions, type RegExpFlagOptions } from "@rsc-utils/core-utils";

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

type Options = RegExpFlagOptions & RegExpAnchorOptions & RegExpCaptureOptions & {
	type: UrlType;
};

function createDiscordUrlRegex(options?: Options): RegExp {
	const { capture, gFlag = "", iFlag = "", type = "message" } = options ?? {};
	const flags = `${gFlag}${iFlag}`;

	switch(type) {
		case "channel":
			return capture
				? new RegExp(`https://discord\\.com/channels/(?<guildId>@me|\\d{16,})/(?<channelId>\\d{16,})(?![/\\d])`, flags)
				: new RegExp(`https://discord\\.com/channels/(?:@me|\\d{16,})/\\d{16,}(?![/\\d])`, flags);
		case "message":
			return capture
				? new RegExp(`https://discord\\.com/channels/(?<guildId>@me|\\d{16,})/(?<channelId>\\d{16,})/(?<messageId>\\d{16,})`, flags)
				: new RegExp(`https://discord\\.com/channels/(?:@me|\\d{16,})/\\d{16,}/\\d{16,}`, flags);
	}
}

export function getDiscordUrlRegex(options?: Options): RegExp {
	return getOrCreateRegex(createDiscordUrlRegex, options);
}