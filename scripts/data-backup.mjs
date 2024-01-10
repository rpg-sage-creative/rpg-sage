import * as fs from "fs";

//#region helpers
/** pads the number to two characters with a prepended zero */
function padDateNumber(num) {
	return String(num).padStart(2, "0");
}
/**
 * formats the data as yyyy-mm-dd-hhmm
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
	return `${date.getFullYear()}-${padDateNumber(date.getMonth()+1)}-${padDateNumber(date.getDate())}-${padDateNumber(date.getHours())}${padDateNumber(date.getMinutes())}`;
}
//#endregion

/**
 * Returns the variable value or an empty string
 * @param {string} key
 * @returns {string}
 */
function readAllShVar(key) {
	const prefix = `${key}=`;
	const all = fs.existsSync("./inc/all.sh") ? fs.readFileSync("./inc/all.sh").toString() : "";
	const lines = all.split(/\n/);
	const line = lines.find(line => line.startsWith(prefix));
	const value = line?.slice(prefix.length) ?? "";
	return value.slice(1, -1);
}

function readBackupPath() {
	const backupDir = readAllShVar("backupDir");
	const cloudSageDataDir = readAllShVar("cloudSageDataDir");
	return backupDir.replace(/\$cloudSageDataDir/, cloudSageDataDir);
}

/**
 * @param {string} root
 * @param {string[]} paths
 * @param {number} sliceLength
 * @param {number} countToKeep
 */
function prunePaths(rootPath, dates, sliceLength, countToKeep) {
	const map = new Map();
	dates.sort();
	dates.forEach(path => map.set(path.slice(0, sliceLength), path));
	const mapDates = [...map.values()].sort();
	const datesToKeep = mapDates.slice(-countToKeep);
	for (const date of dates) {
		if (!datesToKeep.includes(date)) {
			console.info(`Pruning: ${date}`);
			fs.rmSync(`${rootPath}/${date}`, { recursive:true });
		}else {
			console.info(`Keeping: ${date}`);
		}
	}
}

function pruneBackups() {
	const rootPath = readBackupPath().replace(/\\ /g, " ").trim();
	if (rootPath && fs.existsSync(rootPath)) {
		const dates = [];
		try {
			dates.push(...fs.readdirSync(rootPath).filter(name => name.match(/^\d{4}-\d{2}-\d{2}-\d{4}/i)));
		}catch(ex) {
			console.error(`Invalid Dir: ${rootPath}`);
		}
		if (dates.length) {
			const now = formatDate(new Date());
			const today = now.slice(0, 10);
			prunePaths(rootPath, dates.filter(s => !s.startsWith(today)), 10, 10);
			prunePaths(rootPath, dates.filter(s => s.startsWith(today)), 13, 24);
		}
	}else {
		console.warn(`Invalid Path: ${rootPath}`);
	}
}

pruneBackups();
