import { isFiniteNumber, toCircledLetter, toCircledNumber } from "@rsc-utils/core-utils";

type TrackerDotValues = {
	/** the value that represents "off" */
	off: string;
	/** the value that represents "on" */
	on: string;
	/** the value that represents a "unknown" */
	unknown: string;
};

type TrackerDotsData = TrackerDotValues & {
	/** dots suffix to remove from the key */
	keySuffix: string;
};

/** separate function because it is used in both "dots" and "slots" */
function getCircledLetterData(letter: string, keySuffix: "dots" | "letters" | "slots"): TrackerDotsData {
	// we use upper becuase there are no lower negative circled letters
	const upper = letter.toUpperCase();
	return {
		off: toCircledLetter(upper),
		on: toCircledLetter(upper, { negative:true }),
		unknown: "?",
		keySuffix,
	};
}

function findByLetterKey(statKeyPrefix: Lowercase<string>, statKeySuffix: Lowercase<string>): TrackerDotsData | undefined {
	// must be STAT.dots
	if (statKeySuffix === "letters" || statKeySuffix === "az") {
		// test lower a to lower z
		const letter = statKeyPrefix[0];
		const charCode = letter.charCodeAt(0);
		if (96 < charCode && charCode < 123) {
			return getCircledLetterData(letter, statKeySuffix as "letters");
		}
	}

	return undefined;
}

const ShapeDots = new Map<string, TrackerDotValues>([
	["diamonds",  { off: "◇", on: "◆", unknown: "?" }],
	["dots",      { off: "○", on: "●", unknown: "?" }],
	["hearts",    { off: "♡", on: "♥", unknown: "?" }],
	["hexes",     { off: "⬡", on: "⬢", unknown: "?" }],
	["squares",   { off: "▫", on: "▪", unknown: "?" }],
	["stars",     { off: "☆", on: "★", unknown: "?" }],
	["triangles", { off: "△", on: "▲", unknown: "?" }],
]);
ShapeDots.set("dia", ShapeDots.get("diamonds")!);
ShapeDots.set("dot", ShapeDots.get("dots")!);
ShapeDots.set("hrt", ShapeDots.get("hearts")!);
ShapeDots.set("hex", ShapeDots.get("hexes")!);
ShapeDots.set("sqr", ShapeDots.get("squares")!);
ShapeDots.set("str", ShapeDots.get("stars")!);
ShapeDots.set("tri", ShapeDots.get("triangles")!);

function findByShapesKey(_statKeyPrefix: Lowercase<string>, statKeySuffix: Lowercase<string>): TrackerDotsData | undefined {
	// must be STAT.SHAPE or STAT.ALIAS
	const dotValues = ShapeDots.get(statKeySuffix);
	if (dotValues) {
		return {
			...dotValues,
			keySuffix: statKeySuffix,
		};
	}

	return undefined;
}

const NumberAliases: Lowercase<string>[][] = [
	["0th", "zeroth"],
	["1st", "first"],
	["2nd", "second"],
	["3rd", "third"],
	["4th", "fourth"],
	["5th", "fifth"],
	["6th", "sixth"],
	["7th", "seventh"],
	["8th", "eighth"],
	["9th", "ninth"],
	["10th", "tenth"],
] as const;

function findBySlotsKey(statKeyPrefix: Lowercase<string>, statKeySuffix: Lowercase<string>): TrackerDotsData | undefined {
	// must be STAT.slots
	if (statKeySuffix !== "slots") {
		return undefined;
	}

	// cantrips use "c"
	if (statKeyPrefix === "cantrips") {
		return getCircledLetterData("c", "slots");
	}

	// we only allow spell slots for 0-10 (currently)
	const prefixAsNumber = +statKeyPrefix;
	const index = NumberAliases.findIndex((aliases, index) =>
		prefixAsNumber === index
		|| aliases.includes(statKeyPrefix)
	);

	if (index !== -1) {
		return {
			off: toCircledNumber(index),
			on: toCircledNumber(index, { negative:true }),
			unknown: "?",
			keySuffix: "slots",
		};
	}

	return undefined;
}

function findByKey(statKey: string): TrackerDotsData | undefined {
	const [statKeySuffix, statKeyPrefix] = statKey
		.toLowerCase()
		.split(".")
		.reverse() as Lowercase<string>[];
	if (!statKeyPrefix) return undefined;
	return findByLetterKey(statKeyPrefix, statKeySuffix)
		?? findByShapesKey(statKeyPrefix, statKeySuffix)
		?? findBySlotsKey(statKeyPrefix, statKeySuffix);
}

type ParseTrackerDotsArgs = {
	statKey: string;
	trackerDotValues?: string;
};

/**
 * Tries to find the correct data/values for the given shape and statKey.
 * Checks shape (if given), then statKey, then defaults to "dots" if nothing else is found
 */
function defaultTrackerDots({ statKey }: ParseTrackerDotsArgs): TrackerDotValues {
	return findByKey(statKey)
		?? ShapeDots.get("dots")!;
}

/** Parse user set tracker dots values into usable dots values */
function parseTrackerDotsValues(args: ParseTrackerDotsArgs): TrackerDotValues {
	const { trackerDotValues } = args;

	// don't waste time if we don't have anything to work with
	if (!trackerDotValues) {
		return defaultTrackerDots(args);
	}

	//#region backward compatibility

	if (!trackerDotValues.includes(",")) {
		const lower = trackerDotValues.toLowerCase();
		// we need to account for a value that is:
		// - a shape
		// - one of: focuspoints, heropoints, manapoints, staminapoints

		const byShape = findByShapesKey("", lower);
		if (byShape) return byShape;

		if (["focuspoints", "heropoints", "manapoints", "staminapoints"].includes(lower)) {
			return getCircledLetterData(lower[0], "dots");
		}
	}

	//#endregion

	// split values
	const [off, on, unknown = "?"] = trackerDotValues.split(",").map(part => part.trim());

	// we need an "on" or an "off" value, but we can allow one of them to be an empty string ""
	if (!on && !off) {
		return defaultTrackerDots(args);
	}

	return { off, on, unknown };
}

type ToTrackerDotsArgs = {
	/** max of value to render as dots */
	maxValue?: number;
	/** optional shape for dots usage that isn't explicitly set */
	// shape?: ShapeDotsKey;
	/** statKey to be rendered as dots */
	statKey: string;
	/** manually specified dots to use */
	trackerDotValues?: string;
	/** value to render as dots */
	value?: number;
};

export function toTrackerDots({ maxValue, statKey, trackerDotValues, value }: ToTrackerDotsArgs): string {
	const { off, on, unknown } = parseTrackerDotsValues({ statKey, trackerDotValues });

	if (!isFiniteNumber(value)) {
		return unknown;
	}

	// set a value less than 0 to 0
	value = Math.max(value, 0);

	const values: string[] = [];

	// if we have a max number, lets use it
	if (isFiniteNumber(maxValue)) {
		for (let i = 0; i < maxValue && i < value; i++) {
			values.push(on);
		}
		for (let i = values.length; i < maxValue; i++) {
			values.push(off);
		}

	}else {
		for (let i = 0; i < value; i++) {
			values.push(on);
		}
	}

	// just show the dots
	return values.join("");
}

export function parseTrackerDots(key: string) {
	const data = findByKey(key);
	if (data) {
		return {
			// data,
			dotsValues: data.off + "," + data.on + "," + data.unknown,
			statKey: key.slice(0, -1 * (data.keySuffix.length + 1)),
		};
	}
	return undefined;
}