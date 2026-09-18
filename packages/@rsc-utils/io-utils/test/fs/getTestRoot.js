import { join, resolve } from "node:path";

/** Reusable function to get test file path. Accounts for rpg-sage mono repo. */
export function getTestRoot(...parts) {
	if (resolve(".").includes("/rpg-sage")) {
		return resolve(join("packages", "@rsc-utils", "io-utils", "test", "fs", ...parts));
	}
	return resolve(".", "test", "fs", ...parts);
}