type BarGauge = `▕ ` | `▕▁` | `▕▂` | `▕▃` | `▕▄` | `▕▅` | `▕▆` | `▕▇` | `▕█` | `▕?`;

/** 8 different bars, 0% -> 100% */
const gauges: BarGauge[] = [ `▕ `, `▕▁`, `▕▂`, `▕▃`, `▕▄`, `▕▅`, `▕▆`, `▕▇`, `▕█` ];

/**
 * Renders any value/maxValue pair as a vertical bar gauge using two ascii characters.
 * Values: `▕ `, `▕▁`, `▕▂`, `▕▃`, `▕▄`, `▕▅`, `▕▆`, `▕▇`, `▕█`.
 * Invalid input (isNaN) or results (like divide by 0 causing Infinity) returns `▕?`
 */
export function toVerticalGauge(value: number, maxValue: number): BarGauge {
	if (isNaN(value)) return `▕?`; // NOSONAR
	if (isNaN(maxValue)) return `▕?`; // NOSONAR

	const percent = value / maxValue;
	if (!isFinite(percent)) return `▕?`; // NOSONAR

	const eighths = percent * 100 / 12.5;
	const index = Math.floor(eighths);
	return gauges[index];
}
