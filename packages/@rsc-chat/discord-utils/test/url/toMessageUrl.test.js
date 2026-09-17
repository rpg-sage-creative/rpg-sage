import { tagLiterals } from "@rsc-utils/core-utils";
import { toMessageUrl } from "../../build/index.js";

describe("url", () => {
	describe("toMessageUrl", () => {

		// exec().groups will either be undefined or have { guildId, channelId, messageId };
		// we must include keys with undefined values in our expected values

		const tests = [
			{ url:"https://discord.com/channels/@me/1182487240534937610/1192628934014140476", resolvable:{ guildId:undefined, channelId:"1182487240534937610", messageId:"1192628934014140476", type:0 } },
			{ url:"https://discord.com/channels/480488957889609733/1182487240534937610/1192628934014140476", resolvable:{ guildId:"480488957889609733", channelId:"1182487240534937610", messageId:"1192628934014140476", type:0 } },
		];
		tests.forEach(({ url, resolvable }) => {
			test(tagLiterals`toMessageUrl(${resolvable}) === ${url}`, () => {
				expect(toMessageUrl(resolvable)).toStrictEqual(url);
			});
		});

	});
});
