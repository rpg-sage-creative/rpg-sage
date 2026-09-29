
export function splitIntoBatches<T>(items: T[], maxBatchSize: number): T[][] {
	const batches: T[][] = [];
	let batch: T[] | undefined;
	for (const item of items) {
		if (!batch || batch.length === maxBatchSize) {
			batch = [];
			batches.push(batch);
		}
		batch.push(item);
	}
	return batches;
}