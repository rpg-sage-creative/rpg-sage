import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getSubFolders } from "./internal/getSubFolders.js";
import { getTsFiles } from "./internal/getTsFiles.js";
import { parseArgsAndOptions } from "./internal/parseArgsAndOptions.js";

const IndexFilterRegExp = /index\.[cm]?ts$/;
const DotTsExtRegExp = /\.[cm]?ts$/;

function createTodo(path: string, name: string) {
	let output = [];

	// split path
	const pathParts = path.split("/").filter(s => s);
	// start from `src`; remove all ./ or ../ or anything else before /src/
	while (pathParts.length && pathParts[0] !== "src") pathParts.shift();
	// remove `src` to start walking path
	pathParts.shift();

	// if we are in root, use name for the base describe()
	if (!pathParts.length) {
		pathParts.push(name);
	}

	let tabCount = 0;

	// describe each child folder and count tabs
	pathParts.forEach(part => {
		const tabs = "".padStart(tabCount, "\t");
		output.push(`${tabs}describe("${part}", () => {`);
		tabCount++;
	});

	// add todo
	const tabs = "".padStart(tabCount, "\t");
	output.push(`${tabs}test.todo("${name}");`);

	// close each describe block
	while (tabCount--) {
		const tabs = "".padStart(tabCount, "\t");
		output.push(`${tabs}});`);
	}

	return output.join("\n");
}

function process(folderPath: string, recursive: boolean) {
	if (!existsSync(folderPath)) {
		return;
	}

	const fileNames = getTsFiles(folderPath);

	fileNames.filter(name => !IndexFilterRegExp.test(name)).forEach(fileName => {
		const testFolderPath = folderPath.replace("/src", "/test");
		const fileNameRoot = fileName.replace(DotTsExtRegExp, "");
		const testFileName = join(testFolderPath, `${fileNameRoot}.test.js`);
		if (!existsSync(testFileName)) {
			mkdirSync(testFolderPath, { recursive:true });
			writeFileSync(testFileName, createTodo(folderPath, fileNameRoot));
		}
	});

	if (recursive) {
		getSubFolders(folderPath).forEach(pathName => process(join(folderPath, pathName), true));
	}
}

/**
 * Looks for any .ts file that doesn't have a corresponding .test.js file in the /test folder and creates one with a todo.
 */
async function main() {
	const { args, options } = parseArgsAndOptions<{ rootPath?:string; notRecursive?:number; }>();
	const rootPath = options.rootPath ?? args[0] ?? "./";
    const recursive = !options.notRecursive;
	process(join(rootPath, "src"), recursive);
}
await main();