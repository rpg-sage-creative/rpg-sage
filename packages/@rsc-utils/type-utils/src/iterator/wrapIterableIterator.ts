type ValueFn<T, U> = (value: T) => { skip:boolean; value:U; };

export function wrapIterableIterator<T, U>(original: ArrayLike<T> | IterableIterator<T>, valueFn: ValueFn<T, U>): IterableIterator<U> {
	const array = Array.from(original);
	const wrapped: IterableIterator<U> = {
		[Symbol.iterator]() {
			return this;
		},
		next: (): IteratorResult<U> => {
			while (array.length) {
				const { value, skip } = valueFn(array.shift() as T);
				if (!skip) {
					return { value, done:false };
				}
			}
			return { value:undefined, done: true };
		}
		// return?(value?: TReturn): IteratorResult<T, TReturn>;
		// throw?(e?: any): IteratorResult<T, TReturn>;
	};
	return wrapped;
}
