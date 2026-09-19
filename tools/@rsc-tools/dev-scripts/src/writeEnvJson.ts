import { getArgs } from "./internal/getArgs.js";
import type { ArgData, Where } from "./internal/types.js";
import { writeEnvJson } from "./internal/writeEnvJson.js";

type Args = { where:Where; };

async function main() {

	const argData: ArgData = {
		where: {
			prompt: "Where:",
			values: ["local","docker","dev","beta","stable"],
			defValue: "local"
		},
	};

	const args = await getArgs<Args>(argData);

	await writeEnvJson(args);

}
main();