//#region Sort.ts

export type TSorter<T> = (a: T, b: T) => TSortResult;

export type TSortResult = -1 | 0 | 1;

export interface IComparable<T> {
	compareTo(other: IComparable<T>): TSortResult;
}

//#endregion