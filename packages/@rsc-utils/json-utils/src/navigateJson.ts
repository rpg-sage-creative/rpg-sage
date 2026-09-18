type NavigateResults<ValueType = any, ObjectType = any, IsFull extends boolean = boolean> = {
	/** number of keys navigated */
	depth: number;

	/** the path navigated */
	path: string;

	/** was the path fully navigated? */
	isFull: IsFull;

	/** the last object/array navigated */
	parent: IsFull extends true ? ObjectType : unknown;

	/** the last key navigated */
	key: string;

	/** the requested value; only present if isFull === true */
	value?: IsFull extends true ? ValueType : never;
};

export function navigateJson<ValueType = any, ObjectType = any>(object: unknown, path: string): NavigateResults<ValueType, ObjectType>;

export function navigateJson(object: any, path: string): NavigateResults {
	const inObject = (key?: string): key is keyof object => object && key && Object.hasOwn(object, key);

	// store navigated keys
	const navigated: string[] = [];

	// create path keys for navigating
	const keys = path.split(".");

	// reusable fn for shifting keys and checking them for successful navigation
	const shiftKey = () => {
		const key = keys.shift()!;
		if (inObject(key)) {
			navigated.push(key);
			return { key, value:object[key] };
		}
		return { key };
	};

	// reusable fn for creating NavigateResults
	const ret = (key: string, value?: any) => {
		const _path = navigated.join(".");
		return {
			depth: navigated.length,
			path: _path,
			isFull: _path === path,
			parent: object,
			key,
			value
		} as NavigateResults;
	};

	// navigate the keys while we have an object containing the next key
	while (keys.length > 1) {
		const { key, value } = shiftKey();
		if (!inObject(key)) {
			return ret(key);
		}
		object = value;
	}

	// get final key/val
	const { key, value } = shiftKey();
	return ret(key, value);
}