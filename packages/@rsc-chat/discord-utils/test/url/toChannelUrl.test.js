import { tagLiterals } from "@rsc-utils/core-utils";
import { toChannelUrl } from "../../build/index.js";

describe("url", () => {
	describe("toChannelUrl", () => {

		// exec().groups will either be undefined or have { guildId, channelId, messageId };
		// we must include keys with undefined values in our expected values

		const tests = [
			{ url:"https://discord.com/channels/@me/1182487240534937610", resolvable:{ guildId:undefined, channelId:"1182487240534937610", messageId:undefined, type:0 } },
			{ url:"https://discord.com/channels/480488957889609733/1182487240534937610", resolvable:{ guildId:"480488957889609733", channelId:"1182487240534937610", messageId:undefined, type:0 } },
		];
		tests.forEach(({ url, resolvable }) => {
			test(tagLiterals`toChannelUrl(${resolvable}) === ${url}`, () => {
				expect(toChannelUrl(resolvable)).toStrictEqual(url);
			});
		});

	});
});
