import { execCli } from "./internal/execCli.js";

export type CommitData = {
	shortHash: string;
	hash: string;
	subject: string;
	subjectClean: string;
	b: string;
	cTimestamp: number;
	cTimeRelative: string;
	cName: string;
	cEmail: string;
	aTimestamp: number;
	aTimeRelative: string;
	aName: string;
	aEmail: string;
};

type CommitDataKey = keyof CommitData;

/** Uses `git log -1 --pretty=format:""` to parse information about the current commit for the given repoPath. */
export async function readCommit(repoPath: string): Promise<CommitData | undefined> {
	const splitter = "_*|*_";
	const keyMap: Record<CommitDataKey, string> = {
		shortHash: "%h",
		hash: "%H",
		subject: "%s",
		subjectClean: "%f",
		b: "%b",
		cTimestamp: "%ct",
		cTimeRelative: "%cr",
		cName: "%cn",
		cEmail: "%ce",
		aTimestamp: "%at",
		aTimeRelative: "%ar",
		aName: "%an",
		aEmail: "%ae",
	} as const;
	const keys = Object.keys(keyMap) as CommitDataKey[];
	const values = Object.values(keyMap);

	const raw = await execCli(`git log -1 --pretty=format:"${values.join(splitter)}"`, repoPath).catch(() => undefined);
	if (!raw) return undefined;

	const lines = raw.split(splitter);
	return lines.reduce((info, line, lineIndex) => {
		const key = keys[lineIndex]!;
		info[key] = key === "aTimestamp" || key === "cTimestamp" ? +line.trim() : line.trim();
		return info;
	}, { } as Record<CommitDataKey, string | number>) as CommitData;
}