import { existsSync, readFileSync, readdirSync } from "fs";
import { parse } from "../json/bigint/parse.js";

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

let _rootPath: string;
function getRootPath(): string {
	if (!_rootPath) {
		_rootPath = ".";
		if (!existsSync(_rootPath + "/node_modules")) {
			_rootPath = "..";
		}
	}
	return _rootPath;
}

function readBuildInfo(repoPath: string, utilName?: string): BuildInfo | null {
	try {
		const buildInfo = parse(readFileSync(`${repoPath}/build.json`).toString());
		if (!buildInfo.name && utilName) {
			buildInfo.name = utilName;
		}
		return buildInfo;
	}catch(ex) {
		// ignore
	}
	return null;
}

function getRscLibsBuildInfo(): BuildInfo[] {
	const rootPath = getRootPath();
	const utilPath = `${rootPath}/node_modules/@rsc-utils`;
	const allNames = readdirSync(utilPath);
	const utilNames = allNames.filter(dirName => dirName.endsWith("-utils"));
	const buildInfos = utilNames.map(utilName => readBuildInfo(`${utilPath}/${utilName}`, `@rsc-utils/${utilName}`));
	return buildInfos.filter(info => !!info) as BuildInfo[];
}

let buildInfo: BuildInfo | null;

export function getBuildInfo(): BuildInfo {
	if (!buildInfo) {
		buildInfo = readBuildInfo(getRootPath());
	}
	if (!buildInfo) {
		buildInfo = {
			name: "no-name",
			version: "0.0.0",
			branch: "mystery",
			commit: "",
			commitSubject: "unknown",
			commitTs: 0,
			commitDate: "1978-12-24-1945",
			buildTs: 0,
			buildDate: "1978-12-24-1945",
			author: "Randal T Meyer",
			rscLibs: []
		};
	}
	buildInfo.rscLibs = getRscLibsBuildInfo();
	return buildInfo;
}