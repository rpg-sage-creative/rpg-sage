import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getSubFolders } from "./internal/getSubFolders.js";
import { getTsFiles } from "./internal/getTsFiles.js";
import { isValidFile } from "./internal/isValidFile.js";
import { parseArgsAndOptions } from "./internal/parseArgsAndOptions.js";

const FileFilterRegExp = /index\.[cm]?ts/;
const ExportFileRegExp = /\.([mc])?ts/g;

/**
 * @returns {number} number of lines in the index.ts
 */
function process(folderPath: string, recursive: boolean): number {
	if (!existsSync(folderPath)) {
		return -1;
	}

	const subFilter = (name: string) => name !== "internal";
	const exportSubMap = (name: string) => `export * from "./${name}/index.js";`;
	const fileFilter = (name: string) => !FileFilterRegExp.test(name);
	const exportFileReplacer = (_: string, prefix: string) => `.${prefix ?? ""}js`;
	const exportFileMap = (name: string) => `export * from "./${name.replace(ExportFileRegExp, exportFileReplacer)}";`;

	const lines: string[] = [];

	// process child folders if recursive
	const subNames = getSubFolders(folderPath);
	subNames.filter(subFilter).forEach(subName => {
		if (recursive) {
			if (process(join(folderPath, subName), true) > 0) {
				lines.push(exportSubMap(subName));
			}
		}else if (isValidFile(join(folderPath, subName, "index.ts"))) {
			lines.push(exportSubMap(subName));
		}
	});

	// process child files
	const fileNames = getTsFiles(folderPath);
	lines.push(...fileNames.filter(fileFilter).map(exportFileMap));

	// write file
	if (lines.length) {
		writeFileSync(join(folderPath, "index.ts"), lines.join("\n"));
	}

	// return line count
	return lines.length;
}

/**
 * Looks in rootPath/types and updates index.ts to export all contents from all other .ts files.
 */
async function main() {
	const { args, options } = parseArgsAndOptions<{ rootPath?:string; notRecursive?:number; }>();
	const rootPath = options.rootPath ?? args[0] ?? "./";
	const recursive = !options.notRecursive;
	process(join(rootPath, "src"), recursive);
}
await main();