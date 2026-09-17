import { tagLiterals } from "@rsc-utils/core-utils";
import { parseReference } from "../../build/index.js";

describe("parse", () => {
	describe("parseReference", () => {

		// exec().groups will either be undefined or have { guildId, channelId, messageId };
		// we must include keys with undefined values in our expected values

		const tests = [
			{ url:"https://discord.com/channels/@me/1182487240534937610", type:"channel", expected:{ guildId:undefined, channelId:"1182487240534937610", messageId:undefined, type:0 } },
			{ url:"https://discord.com/channels/@me/1182487240534937610", type:"message", expected:undefined },

			{ url:"https://discord.com/channels/480488957889609733/1182487240534937610", type:"channel", expected:{ guildId:"480488957889609733", channelId:"1182487240534937610", messageId:undefined, type:0 } },
			{ url:"https://discord.com/channels/480488957889609733/1182487240534937610", type:"message", expected:undefined },

			{ url:"https://discord.com/channels/@me/1182487240534937610/1192628934014140476", type:"channel", expected:undefined },
			{ url:"https://discord.com/channels/@me/1182487240534937610/1192628934014140476", type:"message", expected:{ guildId:undefined, channelId:"1182487240534937610", messageId:"1192628934014140476", type:0 } },

			{ url:"https://discord.com/channels/480488957889609733/1182487240534937610/1192628934014140476", type:"channel", expected:undefined },
			{ url:"https://discord.com/channels/480488957889609733/1182487240534937610/1192628934014140476", type:"message", expected:{ guildId:"480488957889609733", channelId:"1182487240534937610", messageId:"1192628934014140476", type:0 } },

			{ url:" <https://discord.com/channels/@me/1182487240534937610> ", type:"channel", expected:undefined },
			{ url:" https://discord.com/channels/@me/1182487240534937610 ", type:"channel", expected:undefined },
			{ url:"<https://discord.com/channels/@me/1182487240534937610>", type:"channel", expected:{ guildId:undefined, channelId:"1182487240534937610", messageId:undefined, type:0 } },
		];
		tests.forEach(({ url, type, expected }) => {
			test(tagLiterals`parseReference(${url}, ${type}) === ${expected}`, () => {
				expect(parseReference(url, type)).toStrictEqual(expected);
			});
		});

	});
});
