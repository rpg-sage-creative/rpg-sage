const HitPointTrackers = {
	/** 8 different bars, 0% -> 100% */
	verticalbar: [ `▕ `, `▕▁`, `▕▂`, `▕▃`, `▕▄`, `▕▅`, `▕▆`, `▕▇`, `▕█`, , `▕?` ]
};

type HitPointTracker = { increments:string[]; unknown:string; };

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

	// get unknown from last index
	const unknown = array.pop() as string;

	// get increments by removing the empty value before unknown
	const increments = array.slice(0, -1) as string[];

	return { increments, unknown };
}

export function hpToBar(hp: number, maxHp: number, which?: string): string {
	const { increments, unknown } = parseTracker(which ?? "verticalbar");

	if (isNaN(hp) || isNaN(maxHp)) return unknown;


	const nonZeroIncrements = increments.length - 1;
	const indexDivisor = 100 / nonZeroIncrements;

	const percent = hp / maxHp;
	const fraction = percent * 100 / indexDivisor;

	const index = Math.floor(fraction);

	return increments[index];
}
