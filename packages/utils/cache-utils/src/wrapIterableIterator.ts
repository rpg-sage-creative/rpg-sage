type ValueFn<T, U> = (value: T) => { skip:boolean; value:U; };

/**
 * @internal
 * Used by EphemeralMap and EphemeralSet to wrap their iterators.
 */
export function wrapIterableIterator<T, U>(original: IterableIterator<T>, valueFn: ValueFn<T, U>): IterableIterator<U> {
	const array = Array.from(original);
	const wrapped = {
		[Symbol.iterator]() {
			return this;
		},
		next: () => {
			while (array.length) {
				const { value, skip } = valueFn(array.shift() as T);
				if (!skip) {
					return { value, done:false };
				}
			}
			return { done: true };
		}
	};
	return wrapped as IterableIterator<U>;
}