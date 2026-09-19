/**
 * Creates a Record of flag keys where the value is the number of dashes at the beginning of the flag.
 */
function parseFlags(args: string[]) {
	const filtered = args.filter(arg => arg.startsWith("-") && !arg.includes("="));
	return filtered.reduce((flags, flag) => {
		let count = 0;
		while (flag.startsWith("-")) {
			count++;
			flag = flag.slice(1);
		}
		flags[flag] = count;
		return flags;
	}, {} as Record<string, number>);
}

function parsePairs(args: string[]) {
	const filtered = args.filter(arg => arg.includes("="));
	const pairs = filtered.map((input) => {
		const index = input.indexOf("=");
		return { key:input.slice(0, index), value:input.slice(index + 1) };
	});
	return pairs.reduce((args, pair) => {
		args[pair.key] = pair.value;
		return args;
	}, {} as Record<string, string>);
}

export function parseArgsAndOptions<T extends Record<string, string | number>>(sliceIndex = 3): { args:string[], options:T; } {
	const input = process.argv.slice(sliceIndex);
	const args = input.filter(arg => !arg.startsWith("-") && !arg.includes("="));
	const pairs = parsePairs(input);
	const flags = parseFlags(input);
	const options = { ...pairs, ...flags } as T;
	return { args, options };
}