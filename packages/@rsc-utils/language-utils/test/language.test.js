import { resolve, join } from "node:path";
import { allToUS, initializeNoiseUS, initializeUKtoUS, oneToUS, reduceNoiseUS } from "../build/index.js";

// allows the tests to load data file when in mono repo
function resolvePath(relPath) {
	if (resolve(".").includes("/rpg-sage")) {
		return resolve(join("packages/@rsc-utils/language-utils", relPath));
	}
	return resolve(relPath);
}

describe("language", () => {
	test("oneToUS (uninitialized)", () => expect(oneToUS("colour")).toBe("colour"));
	test("allToUS (uninitialized)", () => expect(allToUS(["colour", "armour", "water"])).toStrictEqual(["colour", "armour", "water"]));

	test("initializeUKtoUS", () => {
		const filePath = resolvePath("./data/ukToUS.txt");
		expect(initializeUKtoUS(filePath)).toBe(1717);
	});

	test("oneToUS (initialized)", () => expect(oneToUS("colour")).toBe("color"));
	test("allToUS (initialized)", () => expect(allToUS(["colour", "armour", "water"])).toStrictEqual(["color", "armor", "water"]));

	const words = "I am a boss of the water and sky".split(" ");
	const reduced = words.filter(s => !["a","and","of","the"].includes(s));

	test("reduceNoiseUS (uninitialized)", () => expect(reduceNoiseUS(words)).toStrictEqual(words));

	test("initializeNoiseUS", () => {
		const filePath = resolvePath("./data/noiseUS.txt");
		expect(initializeNoiseUS(filePath)).toBe(4);
	});

	test("reduceNoiseUS (initialized)", () => expect(reduceNoiseUS(words)).toStrictEqual(reduced));

});
