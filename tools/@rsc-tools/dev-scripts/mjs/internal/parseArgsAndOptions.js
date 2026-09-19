/**
 * Creates a Record of flag keys where the value is the number of dashes at the beginning of the flag.
 */
function parseFlags(args) {
    const filtered = args.filter(arg => arg.startsWith("-") && !arg.includes("="));
    return filtered.reduce((flags, flag) => {
        let count = 0;
        while (flag.startsWith("-")) {
            count++;
            flag = flag.slice(1);
        }
        flags[flag] = count;
        return flags;
    }, {});
}
function parsePairs(args) {
    const filtered = args.filter(arg => arg.includes("="));
    const pairs = filtered.map((input) => {
        const index = input.indexOf("=");
        return { key: input.slice(0, index), value: input.slice(index + 1) };
    });
    return pairs.reduce((args, pair) => {
        args[pair.key] = pair.value;
        return args;
    }, {});
}
export function parseArgsAndOptions(sliceIndex = 3) {
    const input = process.argv.slice(sliceIndex);
    const args = input.filter(arg => !arg.startsWith("-") && !arg.includes("="));
    const pairs = parsePairs(input);
    const flags = parseFlags(input);
    const options = { ...pairs, ...flags };
    return { args, options };
}
