export type KeyValuePair<Value extends number | string, Nil extends null | undefined> = {
	key: string;
	value: Value | Nil;
};

export type KeyValueTrio<Value extends number | string, Nil extends null | undefined> = {
	key: string;
	keyLower: Lowercase<string>;
	value: Value | Nil;
};

export type KeyValueRegex<Value extends number | string, Nil extends null | undefined> = {
	key: string;
	keyRegex: RegExp;
	value: Value | Nil;
};

export type KeyValueQuad<Value extends number | string, Nil extends null | undefined> = {
	key: string;
	keyLower: Lowercase<string>;
	keyRegex: RegExp;
	value: Value | Nil;
};
