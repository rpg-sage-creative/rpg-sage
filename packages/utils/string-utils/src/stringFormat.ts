/**
 * Splits the key into dot notation and looks through the args until it finds a value that matches the key.
 */
function findNamedKey(args: any[], key: string): string | undefined {
	const keyParts = key.split(".");
	for (const arg of args) {
		const value = keyParts.reduce((value, key) => value?.[key], arg);
		if (value !== undefined) {
			return value;
		}
	}
	return undefined;
}

/**
 * Formats the given string template by using the given arguments.
 * The template is searched for indexed args #{0} as well as named args ${name}.
 * Named strings can be dot notation to find children values.
 * Any value that resolves to /undefined/ will *NOT* be replaced, leaving the unused key in the resulting output.
 * ex: stringFormat(`Hello #{0}.`, "Bob"); >> "Hello Bob."
 * ex: stringFormat(`Hello #{1}.`, "Bob"); >> "Hello #{1}."
 * ex: stringFormat(`Hello ${name}.`, { name:"Bob" }); >> "Hello Bob."
 * ex: stringFormat(`${name.first} ${name.last} is a #{1}.`, { name:{first:"Bob",last:"Dole"} }, "Dev); >> "Bob Dole is a Dev."
 */
export function stringFormat<T>(template: string, ...args: T[]): string;

export function stringFormat(template: string, ...args: any[]): string {
	const pairs = new Map();
	return template.replace(/\$\{[\w.[\]]+}|#\{\d+}/g, keyMatch => {
		if (!pairs.has(keyMatch)) {
			const key = keyMatch.slice(2, -1);
			const value = keyMatch.startsWith("$")
				? findNamedKey(args, key)
				: String(args[+key]);
			pairs.set(keyMatch, value ?? keyMatch);
		}
		return pairs.get(keyMatch);
	});
}
