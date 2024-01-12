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

export function getBuildInfo(): BuildInfo {
	const path = "../build.json";
	try {
		return JSON.parse(readFileSync(path).toString());
	}catch(ex) {
		console.error(`Invalid Build Info: ${path}`);
	}
	return {
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