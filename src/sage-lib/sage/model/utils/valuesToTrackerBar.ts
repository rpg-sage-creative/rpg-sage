const GlobalTrackerBars = {
	/** 8 different bars, 0% -> 100% */
	verticalbar: [ `▕ `, `▕▁`, `▕▂`, `▕▃`, `▕▄`, `▕▅`, `▕▆`, `▕▇`, `▕█`, , `▕?` ],
	horizontalbar: [ `┋┉┉┉┉┋`, `┃┉┉┉┉┋`, `┃━┉┉┉┋`, `┃━━┉┉┋`, `┃━━━┉┋`, `┃━━━━┋`, `┃━━━━┃`, , `┋┉?┉┋` ],
};

type TrackerBarValues = {
	min: string;
	increments: string[];
	max: string;
	unknown: string;
};

function parseTrackerBar(trackerBarValues?: string): TrackerBarValues {
	// start by trying to grab a predefined bar
	let array = trackerBarValues ? GlobalTrackerBars[trackerBarValues.toLowerCase() as keyof typeof GlobalTrackerBars] : undefined;

	// try to parse a custom bar
	if (!array && trackerBarValues) {
		// parse into parts
		const parts = trackerBarValues.split(",").map(part => part.trim());
		// we need at least 5 (0 value, 2 values for low/high, max value, unknown value)
		if (parts.length > 4) {
			array = parts;
		}
	}

	// default to vertical bar
	if (!array) {
		array = GlobalTrackerBars["verticalbar"];
	}

	// get a copy of the array without any blank values
	const increments = array.filter(s => s?.trim()) as string[];

	// get min from the start
	const min = increments.shift() as string;

	// get unknown the last element
	const unknown = increments.pop() as string;

	// get max from the right (2nd to last element)
	const max = increments.pop() as string;

	return { min, increments, max, unknown };
}

export function valuesToTrackerBar(value: number, maxValue: number, trackerBarValues?: string): string {
	const { min, increments, max, unknown } = parseTrackerBar(trackerBarValues);

	if (value === null || isNaN(value) || maxValue === null || isNaN(maxValue)) return unknown;

	if (value <= 0) return min;
	if (value >= maxValue) return max;

	const percent = value / maxValue;
	const indexDivisor = 100 / increments.length;
	const fraction = percent * 100 / indexDivisor;

	// Math.max ensures that a low, but non-zero value shows as having value and not 0
	const index = Math.floor(fraction);

	return increments[index];
}