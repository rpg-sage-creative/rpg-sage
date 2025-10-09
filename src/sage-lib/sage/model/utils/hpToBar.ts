const HitPointTrackers = {
	/** 8 different bars, 0% -> 100% */
	verticalbar: [ `▕ `, `▕▁`, `▕▂`, `▕▃`, `▕▄`, `▕▅`, `▕▆`, `▕▇`, `▕█`, , `▕?` ]
};

type HitPointTracker = {
	min: string;
	increments: string[];
	max: string;
	unknown: string;
};

function parseTracker(value: string): HitPointTracker {
	let array: (string | undefined)[] | undefined;

	if (value && value in HitPointTrackers) {
		array = HitPointTrackers[value as keyof typeof HitPointTrackers];
	}

	if (!array) {
		// parse into parts
		const parts = value.split(",").map(part => part.trim());
		// we need at least 5 (0 value, 2 values for low/high, empty separator, unknown value)
		// confirm that all parts have a value except for the empty separator
		if (parts.length > 5 && parts.every((part, index) => index === parts.length - 2 ? !part.length : part.length)) {
			array = parts;
		}
	}

	if (!array) {
		// use verticalbar as default
		array = HitPointTrackers["verticalbar"];
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

export function hpToBar(hp: number, maxHp: number, which?: string): string {
	const { min, increments, max, unknown } = parseTracker(which ?? "verticalbar");

	if (hp === null || isNaN(hp) || maxHp === null || isNaN(maxHp)) return unknown;
console.log({hp,maxHp,percent:hp / maxHp})

	if (hp <= 0) return min;
	if (hp >= maxHp) return max;

	const percent = hp / maxHp;
	const indexDivisor = 100 / increments.length;
	const fraction = percent * 100 / indexDivisor;

	// Math.max ensures that a low, but non-zero value shows as having value and not 0
	const index = Math.max(Math.floor(fraction), 1);

	return increments[index];
}