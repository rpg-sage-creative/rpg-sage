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

export type ArgBase<
			Key extends string = string,
			Value extends number | string = string,
			Nil extends null | undefined | never = null
		> = {
	/** index of the arg in the args array */
	index: number;
	/** does the arg start with a dash? */
	isFlag?: true | never;
	/** is the arg key+= or key-= or key++ or key-- */
	isIncrement?: true | never;
	/** is the arg a value key/value pair? */
	isKeyValue?: true | never;
	/** is the arg a raw value arg */
	isValue?: true | never;
	/** key for the flag or pair */
	key: Key;
	/** lowercase for comparing key */
	keyLower: Lowercase<Key>;
	/** regex for comparing the key */
	keyRegex: RegExp;
	/** how to increment/decrement */
	operator?: "+" | "-" | never;
	/** arg for ValueArg, value for a KeyValueArg and IncrementArg; null for pair with empty string */
	value: Value | Nil;
	/** raw arg text */
	raw: string;
};

export type FlagArg<
			Key extends string = string
		> = Omit<ArgBase<Key, Key, never>, "value"> & {
	/** does the arg start with dashes */
	isFlag: true;
	/** flags don't have value */
	value?: never;
};

export type IncrementArg<
			Key extends string = string,
			Value extends number | string = number,
			Nil extends null | undefined | never = null
		> = ArgBase<Key, Value, Nil> & {
	/** is the arg key+= or key-= or key++ or key-- */
	isIncrement: true;
	/** how to increment/decrement */
	operator: "+" | "-";
};

export type KeyValueArg<
			Key extends string = string,
			Value extends number | string = string,
			Nil extends null | undefined | never = null
		> = ArgBase<Key, Value, Nil> & {
	/** is the arg a value key/value pair? */
	isKeyValue: true;
	/** is the raw key/value pair missing quotes */
	isNaked?: true;
};

export type ValueArg<
			Value extends number | string = string,
			Nil extends null | undefined | never = null
		> = {
	/** raw arg text */
	raw: string;
	/** index of the arg in the args array */
	index: number;
	/** does the arg start with a dash? */
	isFlag?: never;
	/** is the arg key+= or key-= or key++ or key-- */
	isIncrement?: never;
	/** is the arg a value key/value pair? */
	isKeyValue?: never;
	/** is the arg a raw value arg */
	isValue: true;
	/** key for the flag or pair */
	key?: never;
	/** lowercase for comparing the key */
	keyLower?: never;
	/** regex for comparing the key */
	keyRegex?: never;
	/** how to increment/decrement */
	operator?: never;
	/** arg for ValueArg and FlagArg, value for a KeyValueArg; null for pair with empty string */
	value: Value | Nil;
};