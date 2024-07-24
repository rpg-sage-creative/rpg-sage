import { type Collection } from "./Collection.js";

/** Partitions the values into nested Collections based on the partitionfn */
export function partition
		<T>
		(array: T[], partitionfn: (value: T, index: number, array: T[]) => number, thisArg?: any)
		: T[][];

/** Partitions the values into nested Collections based on the partitionfn */
export function partition
		<T>
		(collection: Collection<T>, partitionfn: (value: T, index: number, arrayLike: Collection<T>) => number, thisArg?: any)
		: Collection<Collection<T>>;

export function partition
		<T, U extends T[], V extends T[][]>
		(arrayLike: U, partitionfn: (value: T, index: number, arrayLike: U) => number, thisArg?: any)
		: V {
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
