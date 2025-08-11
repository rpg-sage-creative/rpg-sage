export type KeyValuePair<Value extends number | string, Nil extends null | undefined> = {
	/** the key as found */
	key: string;
	/** if the value is an empty string then Nil is returned */
	value: Value | Nil;
};

export type KeyValueTrio<Value extends number | string, Nil extends null | undefined> = {
	/** the key as found */
	key: string;
	/** used for comparisons: key.toLowerCase() */
	keyLower: Lowercase<string>;
	/** if the value is an empty string then Nil is returned */
	value: Value | Nil;
};

export type KeyValueRegex<Value extends number | string, Nil extends null | undefined> = {
	/** the key as found */
	key: string;
	/** regex for comparing the key: new RegExp(`^${key}$`, "i") */
	keyRegex: RegExp;
	/** if the value is an empty string then Nil is returned */
	value: Value | Nil;
};

export type KeyValueQuad<Value extends number | string, Nil extends null | undefined> = {
	/** the key as found */
	key: string;
	/** used for comparisons: key.toLowerCase() */
	keyLower: Lowercase<string>;
	/** regex for comparing the key: new RegExp(`^${key}$`, "i") */
	keyRegex: RegExp;
	/** if the value is an empty string then Nil is returned */
	value: Value | Nil;
};