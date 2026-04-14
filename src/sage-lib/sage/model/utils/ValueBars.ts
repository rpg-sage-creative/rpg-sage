import { isFiniteNumber } from "@rsc-utils/core-utils";

const GlobalTrackerBars = {
	/** 8 different bars, 0% -> 100% */
	verticalbar: { min:"▕ ", increments:["▕▁", "▕▂", "▕▃", "▕▄", "▕▅", "▕▆", "▕▇"], max:"▕█", unknown:"▕?" },
	horizontalbar: { min:"┆┈┈┈┈┆", increments:["┃┈┈┈┈┆", "┃━┈┈┈┆", "┃━━┈┈┆", "┃━━━┈┆", "┃━━━━┆"], max:"┃━━━━┃", unknown:"┆┈?┈┆" },
};

const GlobalTrackerDots = {
	heropoints: { off: "Ⓗ", on: "🅗", unknown: "?" },
	focuspoints: { off: "Ⓕ", on: "🅕", unknown: "?" },
	manapoints: { off: "Ⓜ", on: "🅜", unknown: "?" },
	staminapoints: { off: "Ⓢ", on: "🅢", unknown: "?" },
	diamonds: { off: "◇", on: "◆", unknown: "?" },
	dots: { off: "○", on: "●", unknown: "?" },
	hearts: { off: "♡", on: "♥", unknown: "?" },
	hexes: { off: "⬡", on: "⬢", unknown: "?" },
	squares: { off: "▫", on: "▪", unknown: "?" },
	triangles: { off: "△", on: "▲", unknown: "?" }
};

type GlobalTrackerDotsKey = keyof typeof GlobalTrackerDots;

type TrackerBarValues = {
	min: string;
	increments: string[];
	max: string;
	unknown: string;
};

function parseTrackerBar(trackerBarValues?: string): TrackerBarValues {
	// don't waste time if we don't have anything to work with
	if (!trackerBarValues) {
		return GlobalTrackerBars.verticalbar;
	}

	// start by trying to grab a predefined bar
	const key = trackerBarValues.toLowerCase();
	if (key in GlobalTrackerBars) {
		return GlobalTrackerBars[key as keyof typeof GlobalTrackerBars];
	}

	// split values
	const increments = trackerBarValues.split(",").map(part => part.trim());

	// min is first value
	const min = increments.shift();

	// default unknown value
	let unknown = "?";

	// unknown is last ... if we have a blank before it
	if (!increments[increments.length - 2] && increments[increments.length - 1]) {
		unknown = increments.pop()!; // pop unknown
		increments.pop();            // pop blank
	}

	// max is last value
	const max = increments.pop();

	// we need to have a min, max, and at least 2 increments
	if (!min || !max || increments.length < 2) {
		return GlobalTrackerBars.verticalbar;
	}

	return { min, increments, max, unknown };
}

export function toTrackerBar(value?: number, maxValue?: number, trackerBarValues?: string): string {
	const { min, increments, max, unknown } = parseTrackerBar(trackerBarValues);

	if (!isFiniteNumber(value) || !isFiniteNumber(maxValue)) {
		return unknown;
	}

	if (value <= 0) {
		return min;
	}

	if (value >= maxValue) {
		return max;
	}

	const percent = value / maxValue;
	const indexDivisor = 100 / increments.length;
	const fraction = percent * 100 / indexDivisor;

	const index = Math.floor(fraction);

	return increments[index];
}

type TrackerDotValues = {
	off: string;
	on: string;
	unknown: string;
};

function statKeyToDotsKey(statKey: string): GlobalTrackerDotsKey | undefined {
	// if the statKey is focuspoints, heropoints, manapoints, or staminapoints
	const lower = statKey.toLowerCase();
	if (lower in GlobalTrackerDots) {
		return lower as GlobalTrackerDotsKey;
	}

	// if the statKey is focus, hero, mana, or stamina
	const lowerPoints = lower + "points";
	if (lowerPoints in GlobalTrackerDots) {
		return lowerPoints as GlobalTrackerDotsKey;
	}

	return undefined;
}

function parseTrackerDots(statKey: string, trackerDotValues?: string): TrackerDotValues {
	// don't waste time if we don't have anything to work with
	if (!trackerDotValues) {
		return GlobalTrackerDots[statKeyToDotsKey(statKey) ?? "dots"];
	}

	// start by trying to grab a predefined dots
	const dotsKey = trackerDotValues.toLowerCase();
	if (dotsKey in GlobalTrackerDots) {
		return GlobalTrackerDots[dotsKey as keyof typeof GlobalTrackerDots];
	}

	// split values
	const [off, on, unknown = "?"] = trackerDotValues.split(",").map(part => part.trim());

	// we need an "on" or an "off" value, but we can allow one of them to be "empty"
	if (!on && !off) {
		return GlobalTrackerDots[statKeyToDotsKey(statKey) ?? "dots"];
	}

	return { off, on, unknown };
}

export function toTrackerDots(statKey: string, value?: number, maxValue?: number, trackerDotValues?: string): string {
	const { off, on, unknown } = parseTrackerDots(statKey, trackerDotValues);

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
