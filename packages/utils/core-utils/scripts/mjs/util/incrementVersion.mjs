/**
 * @param {string} ver
 * @param {"major" | "minor" | "patch"} type
 */
export function incrementVersion(ver, type) {
	if (!["major","minor","patch"].includes(type)) {
		console.warn(`incrementVersion("${ver}", "${type}")`);
		console.warn(`\tInvalid type: "${type}"`);
		process.exit(1);
	}

	const regex = /^v?(\d+)\.(\d+)\.(\d+)(?:-alpha)?$/;
	if (!regex.test(ver)) {
		console.warn(`incrementVersion("${ver}", "${type}")`);
		console.warn(`\tInvalid ver: "${ver}"`);
		process.exit(1);
	}

	const match = regex.exec(ver) ?? [];
	let major = +match[1];
	let minor = +match[2];
	let patch = +match[3];
	switch(type) {
		case "major":
			major++;
			minor = 0;
			patch = 0;
			break;
		case "minor":
			minor++;
			patch = 0;
			break;
		case "patch":
			patch++;
			break;
	}
	return `${major}.${minor}.${patch}`
}