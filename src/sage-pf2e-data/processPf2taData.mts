import utils from "../sage-utils";
import { DistDataPath, info, pf2tCores, sageCores } from "./common.mjs";
import { coresMatch, getTypedCores } from "./pf2-tools-parsers/common.mjs";

export async function processPf2tData(): Promise<void> {
	info(`Processing processPf2tData ...`);

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

	const sageHashes = sageCores.map(core => core.pf2t?.hash).filter(hash => hash);
	const leftovers = pf2tCores.filter(pf2t => !sageHashes.includes(pf2t.hash));

	console.log({leftovers:leftovers.length});
	await utils.FsUtils.writeFile(`${DistDataPath}/pf2t-leftovers.json`, leftovers, true, false);

	const matchesByName = leftovers.map((pf2t, i, a) => {
		const p = 100 * (i + 1) / a.length;
		if (p % 10 === 0) info(`Processing processPf2tData ... matching leftovers - ${p}%`);
		return sageCores.map(sage => coresMatch(pf2t, sage)).filter(match => match.name)
	}).filter(a => a.length);
	const sourceCores = getTypedCores("Source");
	matchesByName.forEach(matches => {
		const { pf2t, sage } = matches.first()!;
		if (matches.length === 1) {
			const source = sourceCores.find(src => src.code === sage.source);
			console.log(`${pf2t.type}::${pf2t.name}::${pf2t.source} !== ${sage.objectType}::${sage.name}::${source?.name ?? sage.source}`);
		}else {
			info(`${pf2t.type}::${pf2t.name}::${pf2t.source} = ${matches.length}`);
		}
	});

	info(`Processing processPf2tData ... done`);
}
