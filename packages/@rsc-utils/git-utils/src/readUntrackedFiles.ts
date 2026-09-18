import { noop } from "@rsc-utils/type-utils";
import { execCli } from "./internal/execCli.js";

export async function readUntrackedFiles(repoPath: string): Promise<string[]> {
	const files = await execCli("git ls-files --exclude-standard --others", repoPath).catch(noop);
	return files
		?.split("\n")
		.map(s => s.trim())
		.filter(s => s)
		?? [];
}