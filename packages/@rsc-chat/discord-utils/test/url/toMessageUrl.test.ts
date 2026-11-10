import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { toMessageUrl } from "../../build/index.js";

describe("url", () => {
	describe("toMessageUrl", () => {

		// [ref, url]; a missing url means we expect undefined
		const tests: { ref:unknown; url?:string; }[] = [
			// MessageReference shapes ("messageId" in ref)
			{ ref:{ guildId:undefined, channelId:"1182487240534937610", messageId:"1192628934014140476", type:0 }, url:"https://discord.com/channels/@me/1182487240534937610/1192628934014140476" },
			{ ref:{ guildId:"480488957889609733", channelId:"1182487240534937610", messageId:"1192628934014140476", type:0 }, url:"https://discord.com/channels/480488957889609733/1182487240534937610/1192628934014140476" },

			// MessageReference partials are allowed to omit "type"
			{ ref:{ guildId:"480488957889609733", channelId:"1182487240534937610", messageId:"1192628934014140476" }, url:"https://discord.com/channels/480488957889609733/1182487240534937610/1192628934014140476" },

			// a falsy messageId cannot produce a url
			{ ref:{ guildId:"480488957889609733", channelId:"1182487240534937610", messageId:"" } },

			// Message shapes use "url" when it is present, even when "id" could produce a different url
			{ ref:{ guildId:"480488957889609733", channelId:"1182487240534937610", id:"1192628934014140476", url:"https://discord.com/channels/963531189254238278/1182487240534937610/1192628934014140476" }, url:"https://discord.com/channels/963531189254238278/1182487240534937610/1192628934014140476" },

			// a falsy "url" falls back to createUrl(guildId, channelId, id)
			{ ref:{ guildId:"480488957889609733", channelId:"1182487240534937610", id:"1192628934014140476", url:"" }, url:"https://discord.com/channels/480488957889609733/1182487240534937610/1192628934014140476" },

			// Messages without a guildId use "@me"
			{ ref:{ channelId:"1182487240534937610", id:"1192628934014140476" }, url:"https://discord.com/channels/@me/1182487240534937610/1192628934014140476" },

			// Messages without a "url" or an "id" cannot produce a url
			{ ref:{ guildId:"480488957889609733", channelId:"1182487240534937610" } },

			// empty objects have neither "messageId" nor "url"/"id"
			{ ref:{ } },

			// falsy refs cannot produce a url
			{ ref:null },
			{ ref:undefined },
		];

		tests.forEach(({ ref, url }) => {
			test(tagLiterals`toMessageUrl(${ref}) === ${url}`, () => {
				expect(toMessageUrl(ref as never)).toStrictEqual(url);
			});
		});

	});
});
