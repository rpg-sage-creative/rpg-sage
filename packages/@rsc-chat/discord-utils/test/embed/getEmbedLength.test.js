import { toLiteral } from "@rsc-utils/core-utils";
import { embedLength } from "discord.js";
import { getEmbedLength } from "../../build/index.js";

describe("embed", () => {
	describe("getEmbedLength", () => {

		const embeds = [
			{ title:"title #1", description:"description #1", author:{ name:"author #1" }, footer: { text:"footer #1" } },
			{ title:"title #2", description:"description #2", author:{ name:"author #2" }, footer: { text:"footer #2" }, fields:[{ name:"field #2.1", value:"value #2.1"}] },
			{ title:"title #3", description:"description #3", color:54321, image:{url:"localhost"}, author:{ name:"author #3", url:"https://rpgsage.io", icon_url:"https://rpgsage.io", proxy_icon_url:"https://proxy.rpgsage.io" }, footer: { text:"footer #3", icon_url:"https://rpgsage.io", proxy_icon_url:"https://proxy.rpgsage.io" }, fields:[{ name:"field #3.1", value:"value #3.1" }, { name:"field #3.2", value:"value #3.2", inline:true }] },
		];
		embeds.forEach(embed => {
			test(`getEmbedLength(${toLiteral(embed)}) === ${embedLength(embed)}`, () => {
				expect(getEmbedLength(embed)).toBe(embedLength(embed));
			});
		});

	});
});