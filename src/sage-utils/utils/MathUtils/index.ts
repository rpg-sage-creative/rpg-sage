export function degToRad(deg: number): number {
	return deg * Math.PI / 180;
}
export function radToDeg(rad: number): number {
	return rad * 180 / Math.PI;
}

export function sinDeg(deg: number): number {
	return Math.sin(deg * 2.0 * Math.PI / 360);
}
export function asinDeg(deg: number): number {
	return Math.asin(deg) * 360 / (2 * Math.PI);
}

export function cosDeg(deg: number): number {
	return Math.cos(deg * 2.0 * Math.PI / 360);
}
export function acosDeg(deg: number): number {
	return Math.acos(deg) * 360 / (2 * Math.PI);
}

export function tanDeg(deg: number): number {
	return Math.tan(deg * 2.0 * Math.PI / 360);
}

export function mod(a: number, b: number): number {
	let result = a % b;
	if (result < 0) {
		result += b;
	}
	return result;
}
