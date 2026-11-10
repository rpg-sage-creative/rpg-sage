/**
 * @private
 * Incoming map meta assumes grid origin of 1,1 not 0,0.
 * This updates a given offset, or simply returns [0, 0] if one wasn't given.
 */
export function gridOffsetToZeroZero(offset?: [number, number]): [number, number] {
	const col = offset ? (offset[0] ?? 0) - 1 : 0;
	const row = offset ? (offset[1] ?? 0) - 1 : 0;
	return [col, row];
}