import { noop } from "@rsc-utils/type-utils";
import { execCli } from "./internal/execCli.js";

export async function readUnstagedChanges(repoPath: string): Promise<string[]> {
	const output = await execCli("git diff-files --ignore-space-at-eol", repoPath).catch(noop);
	if (typeof(output) === "string") {
		return output
			.split("\n")
			.map(line => line.split(" ").pop()?.trim().split("\t").pop()?.trim())
			.filter(s => s) as string[];
	}
	return [];
}