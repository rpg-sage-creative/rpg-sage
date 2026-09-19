import { execCli } from "./internal/execCli.js";
import { getArgs } from "./internal/getArgs.js";
import { promptUser } from "./internal/promptUser.js";
import { readBranches } from "./internal/readBranches.js";
import type { Action, ArgData, CodeName, Force, Ghost, What, Where } from "./internal/types.js";
import { writeDeployJson } from "./internal/writeDeployJson.js";
import { writeEnvJson } from "./internal/writeEnvJson.js";

type Args = {
	action: Action;
	where: Where;
	codeName: CodeName;
	what: What;
	branch: string;
	ghost?: Ghost;
	force?: Force;
};


async function main() {

	const argData: ArgData = {
		where: { argIndex:0, prompt:"Where:", values:["local","docker","dev","beta","stable"], defValue:"local" },
		codeName: { argIndex:1, prompt:"Code Name:", values:["dev","beta","stable"], defValue:"dev" },
		what: { argIndex:2, prompt:"What:", values:["bot","map","pdf","random","search","all","services"], defValue:"bot" },
		branch: { argIndex:3, prompt:"Branch:", values:readBranches(), defValue:"develop" },
		ghost: { prompt:"Ghost Mode?", values:["ghost"], defValue:undefined },
		force: { prompt:"Force Deploy?", values:["--force"], defValue:undefined },
	};

	const args = await getArgs<Args>(argData);

	if (!["docker","dev","beta","stable"].includes(args.where)) {
		console.error(`Cannot deploy to: local`);
		process.exit(1);
	}

	console.log("");
	Object.entries(args).forEach(([ key, value ]) => {
		console.log(`${key[0].toUpperCase() + key.slice(1)}: ${value ?? ""}`);
	});

	const confirm = await promptUser({ prompt:"Is this correct?", values:["yes", "no"], defValue:"n" });
	if (confirm !== "yes") {
		process.exit(1);
	}

	await writeEnvJson(args);

	await writeDeployJson(args);

	if (args.what === "bot" && args.where === "docker") {
		await execCli("docker", "compose", "up", "-d").catch(() => undefined);
		await execCli("pm2", "deploy", "bot.config.cjs", args.where, args.force ?? "").catch(() => undefined);

	}else if (args.what === "bot" && args.where === "dev" && args.branch === "develop") {
		await execCli("pm2", "deploy", "bot.config.cjs", args.where);

	}else if (args.what === "bot" && args.where === "beta" && args.branch === "beta") {
		await execCli("pm2", "deploy", "bot.config.cjs", args.where);

	}else if (args.what === "bot" && args.where === "stable" && args.branch === "main") {
		await execCli("pm2", "deploy", "bot.config.cjs", args.where);

	}else {

		console.log("Nothing else works yet.");
		process.exit(1);
	}

}
main();