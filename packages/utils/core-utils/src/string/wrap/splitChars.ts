type WrapChars = { left:string; right:string; };

/**
 * @internal
 * Splits the chars into left and right.
 * If the chars argument is even, then they are split and used as left/right.
 * If the chars argument is odd, then they are uesd as left and then they are reversed and used as right.
 */
export function splitChars(chars: string): WrapChars {
	//even
	if (chars.length % 2 === 0) {
		const half = chars.length / 2;
		return {
			left: chars.slice(0, half),
			right: chars.slice(half)
		};
	}

	//odd
	return {
		left: chars,
		right: chars.split("").reverse().join("")
	};
}