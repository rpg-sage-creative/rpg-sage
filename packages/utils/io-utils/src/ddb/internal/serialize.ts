import type { AttributeValue } from "@aws-sdk/client-dynamodb";

/** attempts to serialize array and sets. returns undefined if the value is neither */
function serializeArrayOrSet(value: unknown): AttributeValue | undefined {
	if (Array.isArray(value)) {
		return { L:value.map(serialize) };
	}
	if (value instanceof Set) {
		// we send an array, so convert it now
		const values = [...value];

		// track string, number, other types
		const types = { s:false, n:false, o:false };

		// find the types
		for (const val of values) {
			const type = typeof(val);
			if (type === "string") {
				types.s = true;
			}else if (type === "number") {
				types.n = true;
			}else {
				types.o = true;
			}
			// once we know we have mixed data, stop looking
			if (types.o || (types.n && types.s)) {
				break;
			}
		}

		// string only
		if (types.s && !types.n && !types.o) {
			return { SS:values };
		}

		// number only
		if (types.n && !types.s && !types.o) {
			return { NS:values.map(String) };
		}

		// let's just create a custom attribute for a Set
		return serialize({ $SET$:values });
	}
	return undefined;
}

/** serializes the object using key/value pairs */
function serializeObject(value: object): AttributeValue {
	return Object.keys(value).reduce((out, key) => {
		out.M[key] = serialize(value[key as keyof typeof value]);
		return out;
	}, { M:{} } as any);
}

/** @internal */
export function serialize(value: unknown): AttributeValue;
export function serialize(value: []): AttributeValue.LMember;
export function serialize(value: Set<number>): AttributeValue.NSMember;
export function serialize(value: Set<string>): AttributeValue.SSMember;
export function serialize(value: "boolean"): AttributeValue.BOOLMember;
export function serialize(value: "number"): AttributeValue.NMember;
export function serialize(value: "string"): AttributeValue.SMember;
export function serialize(value: "object"): AttributeValue.MMember;
export function serialize(value: unknown): AttributeValue {
	// if (value === undefined) return undefined;

	if (value === null) return { NULL:true }; // NOSONAR

	const arrayOrSet = serializeArrayOrSet(value);
	if (arrayOrSet !== undefined) return arrayOrSet; // NOSONAR

	if (Buffer.isBuffer(value)) return { B:new Uint8Array(value) }; // NOSONAR

	switch(typeof(value)) {
		case "bigint": return serialize({ $BIGINT$:`${value}` });
		case "boolean": return { BOOL:value };
		case "number": return { N:String(value) };
		case "string": return { S:String(value) };

		case "object": return serializeObject(value);

		case "function": throw new Error("Cannot serialize: function");
		case "symbol": throw new Error("Cannot serialize: symbol");
		case "undefined": throw new Error("Cannot serialize: undefined");
		default: throw new Error(`Cannot serialize: ${typeof(value)}`);

		/*
		BinarySet: { BS:Uint8Array[]; }
		*/
	}
}
