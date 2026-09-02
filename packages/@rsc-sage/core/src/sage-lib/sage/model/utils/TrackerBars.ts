import { isFiniteNumber } from "@rsc-utils/core-utils";

const GlobalTrackerBars = {
	/** 8 different bars, 0% -> 100% */
	verticalbar: { min:"▕ ", increments:["▕▁", "▕▂", "▕▃", "▕▄", "▕▅", "▕▆", "▕▇"], max:"▕█", unknown:"▕?" },
	horizontalbar: { min:"┆┈┈┈┈┆", increments:["┃┈┈┈┈┆", "┃━┈┈┈┆", "┃━━┈┈┆", "┃━━━┈┆", "┃━━━━┆"], max:"┃━━━━┃", unknown:"┆┈?┈┆" },
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
