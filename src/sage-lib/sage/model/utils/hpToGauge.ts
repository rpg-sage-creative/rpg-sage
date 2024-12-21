type BarGauge = `▕ ` | `▕▁` | `▕▂` | `▕▃` | `▕▄` | `▕▅` | `▕▆` | `▕▇` | `▕█` | `▕?`;

/** 8 different bars, 0% -> 100% */
const gauges: BarGauge[] = [ `▕ `, `▕▁`, `▕▂`, `▕▃`, `▕▄`, `▕▅`, `▕▆`, `▕▇`, `▕█` ];

function percentToGauge(percent: number): BarGauge {
	const eighths = percent * 100 / 12.5;
	const index = Math.floor(eighths);
	return gauges[index];
}

export function hpToGauge(hp: number, maxHp: number): BarGauge {
	if (isNaN(hp)) return `▕?`;
	if (isNaN(maxHp)) return `▕?`;
	const percent = hp / maxHp;
	return percentToGauge(percent);
}
