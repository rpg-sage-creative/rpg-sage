import { noop } from "@rsc-utils/type-utils";
import { execCli } from "./internal/execCli.js";

/** Uses `git branch --show-current` to read the current git branch for the given repoPath. */
export async function readBranchName(repoPath: string): Promise<string | undefined> {
	const branch = await execCli("git branch --show-current", repoPath).catch(noop);
	return branch?.trim();
}