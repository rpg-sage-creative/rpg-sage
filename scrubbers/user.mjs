import { debug, enableLogLevels, info, verbose } from "@rsc-utils/core-utils";
import { isDirSync, listFilesSync, readJsonFileSync, writeFileSync } from "@rsc-utils/io-utils";
import { updateUser } from "../packages/sage/types/build/updates/updateUser.js";
import { forEach } from "@rsc-utils/progress-utils";

enableLogLevels("development");

const AWS_ROOT = "/home/ec2-user/legacy/data/sage";
const LOCAL_ROOT = "/Users/randaltmeyer/Library/Mobile Documents/com~apple~CloudDocs/code/sage-data";

async function main() {
	const ROOT = isDirSync(AWS_ROOT) ? AWS_ROOT : LOCAL_ROOT;

	const PATH = `${ROOT}/users`;

	const userFiles = listFilesSync(PATH, "json");
	verbose(`.json files found: ${userFiles.length}`);

	let updated = 0;

	forEach("Users", userFiles, (userFile, i) => {
		const FILE_PATH = `${PATH}/${userFile}`;
		const json = readJsonFileSync(FILE_PATH);
		const clone = JSON.parse(JSON.stringify(json));
		updateUser(json);
		if (JSON.stringify(clone) !== JSON.stringify(json)) {
			updated++;
			// if (!i) {
			// 	debug(clone);
			// 	debug(json);
			// }
			// info(`Updated: ${userFile}`);
		}
		// writeFileSync(FILE_PATH, json);
	});

	verbose(`.json files updated: ${updated}`);

}
main();