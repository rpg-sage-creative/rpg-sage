/** @returns {{ object:object; string:string; label:string; stringifyReplacer?:Function|(string|number)[]|null; stringifySpace?:string|number; stringifyMaxLineLength?:number; }[]} */
const cloneParseStringify = () => {
	const date = new Date();
	const dateString = date.toISOString();

	return [
		// { object:XXX, string:OBJECT, label:"" },

		// simple bigint
		{ object:1n, string:JSON.stringify({ $bigint:"1" }), label:`1n` },

		// simple date
		{ object:date, string:JSON.stringify({ $date:dateString }), label:dateString },

		// bigint as property
		{ object:{ a:"Apple", b:1n }, string:JSON.stringify({ a:"Apple", b:{ $bigint:"1" } }), label:`{ a:"Apple", b:1n }` },

		// date as property
		{ object:{ a:"Apple", d:date }, string:JSON.stringify({ a:"Apple", d:{ $date:dateString } }), label:`{ a:"Apple", d:"${dateString}" }` },

		// array of bigint
		{ object:[1n, 2n, 3n], string:JSON.stringify([{ $bigint:"1" }, { $bigint:"2" }, { $bigint:"3" }]), label:`[1n, 2n, 3n]` },

		// array of date
		{ object:[date, date, date], string:JSON.stringify([{ $date:dateString }, { $date:dateString }, { $date:dateString }]), label:`["${dateString}", "${dateString}", "${dateString}"]` },

		// make sure an object with $bigint isn't parsed
		{ object:{ a:"Apple", $bigint:"1" }, string:JSON.stringify({ a:"Apple", $bigint:"1" }), label:`{ a:"Apple", $bigint:"1" }` },

		// make sure an object with $date isn't parsed
		{ object:{ a:"Apple", $date:dateString }, string:JSON.stringify({ a:"Apple", $date:dateString }), label:`{ a:"Apple", $date:"${dateString}" }` },

		// value with null
		{ object:{ a:"Apple", b:null }, string:JSON.stringify({ a:"Apple", b:null }), label:`{ a:"Apple", b:null }` },

		// value with undefined
		{ object:{ a:"Apple", b:undefined }, string:JSON.stringify({ a:"Apple", b:undefined }), label:`{ a:"Apple", b:undefined }` },

		{ object:{ "one": "One", "two": 2 }, string:`{ "one": "One", "two": 2 }`, stringifyMaxLineLength:250, label:`simple single line output`},

		{ object:{ "one": "One", "two": [ 2, 3, 4 ] }, string:`{\n\t"one": "One",\n\t"two": [ 2, 3, 4 ]\n}`, stringifyMaxLineLength:250, label:`simple multiline output`},

		{ object:{ "one": "One", "two": [ "2", { "three": [ 3 ] } ], "four": "4" }, string:`{\n\t"one": "One",\n\t"two": [\n\t\t"2",\n\t\t{\n\t\t\t"three": [ 3 ]\n\t\t}\n\t],\n\t"four": "4"\n}`, stringifyMaxLineLength:250, label:`multiline output`, },
	];
}

/** @returns {{object:object;empty:boolean;keyless:boolean;}[]} */
const emptyKeyless = () => {
	const deleted = { a:"A" };
	delete deleted.a;

	const added = {};
	added.a = undefined;

	return [
		{ object:{},            empty:true,  keyless:true  },
		{ object:{a:undefined}, empty:true,  keyless:false },
		{ object:{a:null},      empty:false, keyless:false },
		{ object:deleted,       empty:true,  keyless:true  },
		{ object:added,         empty:true,  keyless:false },
		{ object:{a:""},        empty:false, keyless:false },
		{ object:{"":""},       empty:false, keyless:false },
		{ object:{"":null},     empty:false, keyless:false },
		{ object:{0:null},      empty:false, keyless:false },
	];
};

/**
 *
 * @param {"cloneJson" | "isEmpty" | "isKeyless" | "parseJson" | "stringifyJson"} name
 * @returns
 */
export function getTests(name) {
	switch(name) {
		case "cloneJson": return cloneParseStringify();
		case "isEmpty": return emptyKeyless();
		case "isKeyless": return emptyKeyless();
		case "parseJson": return cloneParseStringify();
		case "stringifyJson": return cloneParseStringify();
	}
}