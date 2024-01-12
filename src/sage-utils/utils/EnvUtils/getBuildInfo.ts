import { readFileSync } from "fs";

type BuildInfo = {
	buildTs: number,
	buildDate: string,
	buildTime: string,
	branch: string,
	commit: string,
	commitSubject: string,
	commitTs: number,
	commitDate: string,
	commitTime: string,
	author: string;
};

let buildInfo: BuildInfo;

export function getBuildInfo(): BuildInfo {
	if (!buildInfo) {
		const paths = ["./build.json", "../build.json"];
		for (const path of paths) {
			try {
				buildInfo = JSON.parse(readFileSync(path).toString());
			}catch(ex) {
				// ignore
			}
		}
	}
	if (!buildInfo) {
		buildInfo = {
			buildTs: 0,
			buildDate: "1978-12-24",
			buildTime: "1945",
			branch: "mystery",
			commit: "",
			commitSubject: "unknown",
			commitTs: 0,
			commitDate: "1978-12-24",
			commitTime: "1945",
			author: "Randal T Meyer"
		};
	}
	return buildInfo;
}