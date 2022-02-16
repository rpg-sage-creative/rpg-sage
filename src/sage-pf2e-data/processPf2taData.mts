import utils from "../sage-utils";
import { DistDataPath, info, getPf2tCores, getSageCores } from "./common.mjs";
import { coresMatch, objectTypeToPf2Type } from "./pf2-tools-parsers/common.mjs";

export async function processPf2tData(): Promise<void> {
	info(`Processing processPf2tData ...`);

	const sageCores = getSageCores();
	const pf2tCores = getPf2tCores();

	const sageTypes: string[] = [];
	sageCores.pluck("objectType", true)
			.concat(sageCores.pluck("classPath", true).filter(s => s) as string[])
			.forEach(type => {
		const clean = objectTypeToPf2Type(type, true);
		if (!sageTypes.includes(clean)) sageTypes.push(clean);
		const typed = objectTypeToPf2Type(type);
		if (!sageTypes.includes(typed)) sageTypes.push(typed);
	});

	const pf2tTypes: string[] = [];
	pf2tCores.pluck("type", true)
			.forEach(type => {
		const clean = type.toLowerCase().replace(/^cantrip$/, "spell");
		if (!pf2tTypes.includes(clean)) pf2tTypes.push(clean);
	});

	const missing = pf2tTypes.filter(type => !sageTypes.includes(type));
	info({missing});

	const sageHashes = sageCores.map(core => core.pf2t?.hash).filter(hash => hash);
	const leftovers = pf2tCores.filter(pf2t => !sageHashes.includes(pf2t.hash));

	info({leftovers:leftovers.length});
	await utils.FsUtils.writeFile(`${DistDataPath}/pf2t-leftovers.json`, leftovers, true, false);

	const matchesByName = leftovers.map((pf2t, i, a) => {
		const p = 100 * (i + 1) / a.length;
		if (p % 10 === 0) info(`Processing processPf2tData ... matching leftovers - ${p}%`);
		return sageCores.map(sage => coresMatch(pf2t, sage)).filter(match => match.name)
	}).filter(a => a.length);
	const sourceCores = getSageCores("Source");
	matchesByName.forEach(matches => {
		matches.forEach(({ pf2t, sage, sageType, type, source }) => {
			const sourceCore = sourceCores.find(src => src.code === sage.source);
			if(false)info(`${pf2t.name}: ${pf2t.type} ${type ? "===" : "!=="} ${sageType ?? sage.objectType} :: ${pf2t.source} ${source ? "===" : "!=="} ${sourceCore?.name ?? sage.source}`);
		});
	});

	info(`Processing processPf2tData ... done`);
}
