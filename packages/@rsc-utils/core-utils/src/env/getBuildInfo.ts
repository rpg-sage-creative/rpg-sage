import { noop } from "@rsc-utils/type-utils";
import { readRepo } from "@rsc-utils/git-utils";

type BuildInfo = {
	name: string;
	version: string;
	branch: string;
	commit: string;
	commitSubject: string;
	commitTs: number;
	commitDate: string;
	buildTs: number;
	buildDate: string;
	author: string;
	rscLibs: { name:string; version:string; }[];
};


/** @deprecated use readRepo() instead. */
export async function getBuildInfo(): Promise<BuildInfo> {
	const repo = await readRepo(".").catch(noop);
	return {
		name: repo?.package?.name ?? "no-name",
		version: repo?.package?.version ?? "0.0.0",
		branch: repo?.branch ?? "mystery",
		commit: repo?.commit?.hash ?? "",
		commitSubject: repo?.commit?.subject ?? "unknown",
		commitTs: repo?.commit?.cTimestamp ?? 0,
		commitDate: repo?.commit?.cTimeRelative ?? "2022-08-22-0000",
		buildTs: repo?.build?.birthtimeMs || repo?.build?.ctimeMs || 0,
		buildDate: repo?.build?.birthtimeMs || repo?.build?.ctimeMs ? new Date(repo?.build?.birthtimeMs || repo?.build?.ctimeMs).toISOString() : "2022-08-22-0000",
		author: repo?.commit?.aName ?? "RPG Sage Creative, LLC",
		rscLibs: repo?.rscUtils ?? [],
	};
}