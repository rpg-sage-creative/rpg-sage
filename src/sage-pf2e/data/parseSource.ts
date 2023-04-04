import { isDefined } from "../../sage-utils";
import { Source, SourceCore } from "../model/base/Source";
import { getByType } from "./repoMap";

const missingSources: string[] = [];

export type TParsedSource = { name:string; source?:Source; page:number; version?:string; };
type TSourceOrCore = Source | SourceCore;

function matchSourceNames(a: string, b: string): boolean {
	return a === b
		|| a.replace(/-/g, " ") === b.replace(/-/g, " ")
		|| a.replace(/Shadows$/, "Shadow") === b.replace(/Shadows$/, "Shadow")
		|| a.replace(/Pathfinder Society Guide/, "PFS Guide") === b.replace(/Pathfinder Society Guide/, "PFS Guide");
}

function matchSourceByName(cores: TSourceOrCore[], name: string): TSourceOrCore | undefined {
	return cores.find(core => matchSourceNames(core.name, name));
}

function matchSourceByApName(cores: TSourceOrCore[], name: string): TSourceOrCore | undefined {
	return cores.find(core => matchSourceNames(`${core.apNumber} ${core.name}`, name));
}

function matchSourceByProductLineName(cores: TSourceOrCore[], name: string): TSourceOrCore | undefined {
	return cores.find(core => matchSourceNames(core.name, `${core.productLine}: ${name}`))
		?? cores.find(core => matchSourceNames(core.name, `${core.productLine}: The ${name}`));
}

function matchSource(sources: TSourceOrCore[], name: string): Source | undefined {
	const match = matchSourceByName(sources, name)
		?? matchSourceByProductLineName(sources, name)
		?? matchSourceByApName(sources, name);
	if (match) {
		return match instanceof Source ? match : new Source(match);
	}
	return undefined;
}

/** Parses a single source string into Sage's source format. */
export function parseSource(value?: string, sources?: TSourceOrCore[]): TParsedSource | null {
	// "source": "Core Rulebook pg. 283 2.0",
	const parts = value?.match(/^(.*?) pg. (\d+)(?: \d+\.\d+)?$/);
	if (!parts) {
		// console.log(value, sources?.map(src => src.name));
		return null;
	}

	const name = parts[1];
	const page = +parts[2];
	const version = parts[3];

	if (!(sources?.length)) {
		sources = getByType<Source>("Source");
	}

	const source = matchSource(sources, name);
	if (!source && !missingSources.includes(name)) {
		missingSources.push(name);
		console.log(`Unknown Source: ${name}`);
		return null;
	}

	return { source, name, page, version };
}

/** Parses multiple source strings into Sage's source format. */
export function parseSources(value?: string | string[], sources?: TSourceOrCore[]): TParsedSource[] {
	const values = Array.isArray(value)
		? value
		: value?.split(/\s*,\s*/) ?? [];
	return values
		.map(val => parseSource(val, sources))
		.filter(isDefined);
}
