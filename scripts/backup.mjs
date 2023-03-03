import * as fs from "fs";

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

function readCloudSageDataPath() {
	return readAllShVar("cloudSageDataDir");
}

function readBackupPath() {
	const cloudSageDataDir = readCloudSageDataPath();
	const backupDir = readAllShVar("backupDir");
	return backupDir.replace(/\$cloudSageDataDir/, cloudSageDataDir);
}

function pruneBackups() {
	const unescaped = readBackupPath().replace(/\\ /g, " ").trim();
	if (unescaped && fs.existsSync(unescaped)) {
		const backups = [];
		try {
			backups.push(...fs.readdirSync(unescaped).filter(name => name.match(/^\d{4}\-\d{2}\-\d{2}\-\d{4}/i)));
		}catch(ex) {
			console.error(`Invalid Dir: ${unescaped}`);
		}
		if (backups.length) {
			backups.sort();
			const oldPaths = backups.slice(0, -10);
			if (oldPaths.length) {
				for (const oldPath of oldPaths) {
					fs.rmSync(`${unescaped}/${oldPath}`, { recursive:true });
				}
			}
		}
	}else {
		console.warn(`Invalid Path: ${unescaped}`);
	}
}

pruneBackups();
