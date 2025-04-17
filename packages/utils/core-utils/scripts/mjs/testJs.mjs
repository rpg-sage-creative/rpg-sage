import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "fs";

/**
 * @param {string} path
 * @returns {boolean}
 */
function isValidDirectory(path) {
	try {
		const name = path.split("/").pop();
		return /^(?<!\.)\w/.test(name) && statSync(path).isDirectory();
	}catch(ex) {
		// ignore
	}
	return false;
}

/**
 * @param {string} path
 * @returns {boolean}
 */
function isValidFile(path) {
	try {
		const name = path.split("/").pop();
		return /(?<!index)\.([mc])?ts$/.test(name) && statSync(path).isFile();
	}catch(ex) {
		// ignore
	}
	return false;
}

/**
 * Returns all subFolder names that don't start with a period.
 * @param {string} path
 * @returns {string[]}
 */
function getSubFolders(path) {
	try {
		if (isValidDirectory(path)) {
			const children = readdirSync(path);
			const filtered = children.filter(child => isValidDirectory(`${path}/${child}`));
			return filtered;
		}
	}catch (ex) {
		// ignore
	}
	return [];
}

/**
 * Returns all fileNames names that end in .ts
 * @param {string} path
 * @returns {string[]}
 */
function getTsFiles(path) {
	try {
		if (isValidDirectory(path)) {
			const children = readdirSync(path);
			const filtered = children.filter(child => isValidFile(`${path}/${child}`));
			return filtered;
		}
	}catch (ex) {
		// ignore
	}
	return [];
}

function createTodo(path, name) {
	let output = [];

	let tabCount = 0;

	path.replace(/\.\/+src\//, "").split("/").forEach(part => {
		const tabs = "".padStart(tabCount, "\t");
		output.push(`${tabs}describe("${part}", () => {`);
		tabCount++;
	});

	const tabs = "".padStart(tabCount + 1, "\t");
	output.push(`${tabs}test.todo("${name}");`);

	while (tabCount--) {
		const tabs = "".padStart(tabCount, "\t");
		output.push(`${tabs}});`);
	}

	return output.join("\n");
}

/**
 *
 * @param {string} folderPath
 * @param {boolean} recursive
 */
function process(folderPath, recursive) {
	if (!existsSync(folderPath)) {
		return;
	}

	const fileNames = getTsFiles(folderPath);

	fileNames.filter(name => !/index\.[cm]?ts$/.test(name)).forEach(fileName => {
		const testFolderPath = folderPath.replace(/\/src\//, "/test/");
		const fileNameRoot = fileName.replace(/\.[cm]?ts$/, "");
		const testOutput = createTodo(folderPath, fileNameRoot);
		const testFileName = `${testFolderPath}/${fileNameRoot}.test.js`;
		if (!existsSync(testFileName)) {
			mkdirSync(testFolderPath, { recursive:true });
			writeFileSync(testFileName, testOutput);
		}
	});

	if (recursive) {
		getSubFolders(folderPath).forEach(pathName => process(`${folderPath}/${pathName}`, true));
	}
}

/**
 * Looks for any .ts file that doesn't have a corresponding .test.js file in the /tests folder and creates one with a todo.
 * @param {string[]} args
 * @param {{ r?:boolean; recursive?:boolean; rootPath?:string; }} options
 */
export function testJs(args, options) {
	const rootPath = options.rootPath ?? args[0] ?? "./";
	const recursive = options.r ?? options.recursive ?? false;
	process(`${rootPath}/src`, recursive);
}
