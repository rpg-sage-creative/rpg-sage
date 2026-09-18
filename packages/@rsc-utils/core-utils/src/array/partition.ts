
/** Partitions the values into nested Collections based on the partitionfn */
export function partition
		<T, U extends T[] = T[], V extends T[][] = T[][]>
		(arrayLike: T[], partitionfn: (value: T, index: number, arrayLike: U) => number, thisArg?: any)
		: V {

	// create typed array for output
	const arrayConstructor = arrayLike.constructor as ArrayConstructor;
	const partitioned = new arrayConstructor() as V;

	arrayLike.forEach((value, index, array) => {
		const partIndex = partitionfn.call(thisArg, value, index, array as U);
		if (!partitioned[partIndex]) {
			partitioned[partIndex] = new arrayConstructor();
		}
		partitioned[partIndex].push(value);
	});

	return partitioned;
}
