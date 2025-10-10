import { isFiniteNumber } from "@rsc-utils/core-utils";

const GlobalTrackerBars = {
	/** 8 different bars, 0% -> 100% */
	verticalbar: { min:`▕ `, increments:[`▕▁`, `▕▂`, `▕▃`, `▕▄`, `▕▅`, `▕▆`, `▕▇`], max:`▕█`, unknown:`▕?` },
	horizontalbar: { min:`┋┉┉┉┉┋`, increments:[`┃┉┉┉┉┋`, `┃━┉┉┉┋`, `┃━━┉┉┋`, `┃━━━┉┋`, `┃━━━━┋`], max:`┃━━━━┃`, unknown:`┋┉?┉┋` },
};

// const GlobalTrackerDots = {
// 	heropoints: { off:"\u{24bd}", on:"\u{1F157}", unknown:"?" },
// 	focuspoints: { off:"\u{24bb}", on:"\u{1F155}", unknown:"?" },
// 	manapoints: { off:"\u{24c2}", on:"\u{1F15C}", unknown:"?" },
// 	staminapoints: { off:"\u{24c8}", on:"\u{1F162}", unknown:"?" },
// 	diamonds: { off:"◇", on:"◆", unknown:"?" },
// 	dots: { off:"○", on:"●", unknown:"?" },
// 	hearts: { off:"♡", on:"♥", unknown:"?" },
// 	hexes: { off:"⬡", on:"⬢", unknown:"?" },
// 	squares: { off:"▫", on:"▪", unknown:"?" },
// 	triangles: { off:"△", on:"▲", unknown:"?" },
// };
const GlobalTrackerDots = {
	heropoints: { off: 'Ⓗ', on: '🅗', unknown: '?' },
	focuspoints: { off: 'Ⓕ', on: '🅕', unknown: '?' },
	manapoints: { off: 'Ⓜ', on: '🅜', unknown: '?' },
	staminapoints: { off: 'Ⓢ', on: '🅢', unknown: '?' },
	diamonds: { off: '◇', on: '◆', unknown: '?' },
	dots: { off: '○', on: '●', unknown: '?' },
	hearts: { off: '♡', on: '♥', unknown: '?' },
	hexes: { off: '⬡', on: '⬢', unknown: '?' },
	squares: { off: '▫', on: '▪', unknown: '?' },
	triangles: { off: '△', on: '▲', unknown: '?' }
};

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

	// unknown is last ... if we have a blank before it
	const unknown = !increments[increments.length - 2] && increments[increments.length - 1] ? increments.pop()! : "?";

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

function parseTrackerDots(trackerDotValues?: string): TrackerDotValues {
	// don't waste time if we don't have anything to work with
	if (!trackerDotValues) {
		return GlobalTrackerDots.dots;
	}

	// start by trying to grab a predefined dots
	const key = trackerDotValues.toLowerCase();
	if (key in GlobalTrackerDots) {
		return GlobalTrackerDots[key as keyof typeof GlobalTrackerDots];
	}

	// split values
	const [off, on, unknown = "?"] = trackerDotValues.split(",").map(part => part.trim()).filter(part => part);

	// we need both off and on
	if (!off || !on) {
		return GlobalTrackerDots.dots;
	}

	return { off, on, unknown };
}

export function toTrackerDots(value?: number, maxValue?: number, trackerDotValues?: string): string {
	const { off, on, unknown } = parseTrackerDots(trackerDotValues);

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