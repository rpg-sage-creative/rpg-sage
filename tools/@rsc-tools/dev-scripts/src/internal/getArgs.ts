import type { ArgData } from "./types.js";
import { promptUser } from "./promptUser.js";

export async function getArgs<
			U extends Record<Key, string | undefined>,
			T extends ArgData = ArgData,
			Key extends keyof T = keyof T,
		>(argData: T): Promise<U> {
	const args: Record<Key, string | undefined> = { } as U;

	const cliArgs = process.argv.slice(2);
	const noPrompt = cliArgs.includes("--noPrompt");

	const argKeys = Object.keys(argData) as Key[];
	for (let i = 0; i < argKeys.length; i++) {
		const argKey = argKeys[i];
		const { argIndex, prompt, values } = argData[argKey];
		let cliArg = cliArgs.find((arg, cliIndex) => (!argIndex || argIndex === cliIndex) && values.includes(arg));
		if (cliArg) {
			console.log(prompt + " " + cliArg);
		}else if (!noPrompt) {
			cliArg = await promptUser(argData[argKey]).catch(console.error) ?? undefined;
		}
		args[argKey] = cliArg;
	}
	return args as U;
}