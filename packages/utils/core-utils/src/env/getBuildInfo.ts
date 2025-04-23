import { exists, readFile, readdir } from "fs";
import { parseJson } from "../json/parseJson.js";
import type { OrUndefined } from "../types/generics.js";

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
	rscLibs: BuildInfo[];
};

async function readBuildInfo(repoPath: string, utilName?: string): Promise<OrUndefined<BuildInfo>> {
	// read the build info
	const raw = await new Promise<OrUndefined<string>>(resolve =>
		readFile(`${repoPath}/build.json`, null, (error, buffer) => resolve(error ? undefined : String(buffer)))
	).catch(() => undefined);

	// return now if we got an error
	if (!raw) return undefined;

	// parse the build info
	const buildInfo = parseJson<BuildInfo>(raw);

	// set name as utilName if name is missing (why?)
	if (!buildInfo.name && utilName) {
		buildInfo.name = utilName;
	}

	return buildInfo;
}

async function getRscLibsBuildInfo(rootPath: string): Promise<BuildInfo[]> {
	const buildInfos: BuildInfo[] = [];

	const utilPath = `${rootPath}/node_modules/@rsc-utils`;

	const allNames = await new Promise<string[]>(resolve =>
		readdir(utilPath, (err, files) => resolve(err ? [] : files))
	).catch(() => []);

	const utilNames = allNames.filter(dirName => dirName.endsWith("-utils"));
	for (const utilName of utilNames) {
		const buildInfo = await readBuildInfo(`${utilPath}/${utilName}`, `@rsc-utils/${utilName}`).catch(() => undefined);;
		if (buildInfo) {
			buildInfos.push(buildInfo);
		}
	}
	return buildInfos;
}

export async function getBuildInfo(): Promise<BuildInfo> {
	// check current folder for node_modules
	const useCurrent = await new Promise<boolean>(resolve =>
		exists(`./node_modules`, resolve)
	).catch(() => false);

	// set rootPath based on presence of node_modules
	const rootPath = useCurrent ? "." : "..";

	// read active repo's build info
	let buildInfo = await readBuildInfo(rootPath).catch(() => undefined);

	// provide dummy info if something went wrong
	if (!buildInfo) {
		buildInfo = {
			name: "no-name",
			version: "0.0.0",
			branch: "mystery",
			commit: "",
			commitSubject: "unknown",
			commitTs: 0,
			commitDate: "2022-08-22-0000",
			buildTs: 0,
			buildDate: "2022-08-22-0000",
			author: "RPG Sage Creative, LLC",
			rscLibs: []
		};
	}

	// include build info for rsc libraries
	buildInfo.rscLibs = await getRscLibsBuildInfo(rootPath);

	return buildInfo;
}