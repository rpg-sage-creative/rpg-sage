type ValueFn<T, U> = (value: T) => { skip:boolean; value:U; };

export function wrapSetIterator<T, U>(original: ArrayLike<T> | SetIterator<T>, valueFn: ValueFn<T, U>): SetIterator<U> {
	const array = Array.from(original);
	return Iterator.from({
		next: (): IteratorResult<U> => {
			while (array.length) {
				const { value, skip } = valueFn(array.shift() as T);
				if (!skip) {
					return { value, done:false };
				}
			}
			return { value:undefined, done: true };
		}
	});
}
