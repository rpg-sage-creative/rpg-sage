import utils from "../sage-utils";
import { DistDataPath, info, pf2tCores, sageCores } from "./common.mjs";

export async function processPf2tData(): Promise<void> {
	const objectTypes = sageCores.pluck("objectType", true);
	const classPaths = sageCores.pluck("classPath", true).filter(s => s) as string[];
	const sageTypes = objectTypes.concat(classPaths).map(toPf2Type);

	function toPf2Type<T extends string | undefined>(value?: T): T {
		value = value?.replace(/[\s']/g, "").toLowerCase() as T;
		switch (value) {
			case "faith": return "deity" as T;
			case "focusspell": return "focus" as T;
			case "gear": return "item" as T;
			default: return value as T;
		}
	}
	function toSageType(value: string): string {
		return value.toLowerCase().replace(/^cantrip$/, "spell");
	}

	const pf2tTypes = pf2tCores.pluck("type", true).map(toSageType);
	const missing = pf2tTypes.filter(type => !sageTypes.includes(type));
	info({missing});

	const pf2tJSON = pf2tCores.map(core => JSON.stringify(core));
	const sageJSON = sageCores.map(core => JSON.stringify(core.pf2t));

	const leftovers = pf2tJSON.filter(pf2t => !sageJSON.find(sage => pf2t === sage));
	console.log({leftovers:leftovers.length});
	await utils.FsUtils.writeFile(`${DistDataPath}/pf2t-leftovers.json`, `[${leftovers.join(",")}]`, true, false);
}