import { toLiteral } from "@rsc-utils/core-utils";
import { ImageCacher } from "../../build/index.js";

beforeAll(() => {
	process.env.dataRoot = "./test";
});

describe("image", () => {
	describe("ImageCacher", () => {

		const tests = [
			{ url:"https://rpgsage.io/test-images/259x591-21413.jpg", size:21413, width:259, height:591, type:"jpeg" },
			{ url:"https://rpgsage.io/test-images/32x32-4871.png", size:4871, width:32, height:32, type:"png" },
			{ url:"https://rpgsage.io/test-images/2494x2046-75630.webp", size:75630, width:2494, height:2046, type:"webp" },
			{ url:"https://rpgsage.io/test-images/411x412-499203.gif", size:499203, width:411, height:412, type:"gif" },
			// { url:"file://~/Downloads/AnimatedPath_0.66.v2.gif", size:499203, width:411, height:412, type:"gif" },
			// { url:undefined, size:000, width:000, height:000, type:"png" },
		];

		tests.forEach(({ url, size, width, height, type }) => {
			test(`ImageCacher.readMetadata(${toLiteral(url)})`, async () => {
				const meta = await ImageCacher.readMetadata(url);
				expect(meta).toBeDefined();
				if (meta) {
					expect(meta.size).toBe(size);
					expect(meta.width).toBe(width);
					expect(meta.height).toBe(height);
					expect(meta.type).toBe(type);
				}
			}, 10*1000);
		});

	});
});