import { pause } from "@rsc-utils/core-utils";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { PathbuilderCharacter } from "../../../sage-pf2e/model/pc/PathbuilderCharacter.js";
import { fetchCores as fetchAll, fetchJsonCore, fetchCore as fetchOne, type FetchResult } from "../../utils/io/fetchCores.js";
import { jsonToCharacterCore } from "../sf2e/import/pdf/jsonToCharacter.js";
import type { PathbuilderCharacterCore } from "./pathbuilder-2e/types.js";
import { validCoreOrUndefined } from "./pathbuilder-2e/validCoreOrUndefined.js";
import { wanderersGuideToPathbuilderJson } from "./wanderers-guide/wanderersGuideToPathbuilderJson.js";

function createHandlers() {
	return {
		char: (core: PathbuilderCharacterCore) => new PathbuilderCharacter(core),
		pdf: jsonToCharacterCore,
		raw: (json: unknown) => validCoreOrUndefined(json) ?? wanderersGuideToPathbuilderJson(json),
	};
}

/** pathbuilder queue consists of id, promise, and resolve function */
type PathbuilderQueueItem = {
	id: number;
	promise: Promise<FetchResult<PathbuilderCharacterCore>>;
	resolve: (result: FetchResult<PathbuilderCharacterCore>) => void;
	reject: (reason?: any) => void;
};

/** stores all pathbuilder import requests */
const pathbuilderQueue: PathbuilderQueueItem[] = [];

/** stores active pathbuilder import request */
let activePathbuilderQueueItem: PathbuilderQueueItem | undefined;

/** stores last fetch ts to help throttle requests */
let lastPathbuilderFetchTs = 0;

/** Processes the pathbuilder import queue one item at a time */
async function processPathbuilderQueue() {
	// we have one an active item, return out
	if (activePathbuilderQueueItem) {
		return;
	}

	// get the next item
	activePathbuilderQueueItem = pathbuilderQueue.shift();

	// if there is no next item, return out
	if (!activePathbuilderQueueItem) {
		return;
	}

	// get ms since last fetch
	const tsSinceLastFetch = Date.now() - lastPathbuilderFetchTs;

	// Pathbuilder limits requests to 10 / minute per IP (6 seconds each)
	if (tsSinceLastFetch < 6000) {
		// make sure we don't spam the pathbuilder server
		await pause(6000 - tsSinceLastFetch, "Pathbuilder Throttle");
	}

	// get queue info
	const { id, resolve } = activePathbuilderQueueItem;

	// build url
	const exportUrl = `https://pathbuilder2e.com/json.php?id=${id}`;

	// fetch the json
	const coreOrError = await fetchJsonCore<PathbuilderCharacterCore>(exportUrl, "INVALID_ID", createHandlers())

	// mark time between fetches
	lastPathbuilderFetchTs = Date.now();

	// resolve promise
	resolve({ id, ...coreOrError });

	// clear active item
	activePathbuilderQueueItem = undefined;

	// trigger next item in the queue
	processPathbuilderQueue();
}

/** Uses id="" from the import command as Pathbuilder's "Export JSON" id. */
async function fetchByPathbuilderId(sageCommand: SageCommand): Promise<FetchResult<PathbuilderCharacterCore> | undefined> {
	const id = sageCommand.args.getNumber("id");
	if (id) {
		// create the promise
		const { promise, resolve, reject } = Promise.withResolvers<FetchResult<PathbuilderCharacterCore>>();
		// add an item to the pathbuilder queue
		pathbuilderQueue.push({ id, promise, resolve, reject });
		// process the queue
		processPathbuilderQueue();
		// return the promise
		return promise;
	}
	return undefined;
}

export async function fetchCore(sageCommand: SageCommand): Promise<FetchResult<PathbuilderCharacterCore> | undefined> {
	return (await fetchByPathbuilderId(sageCommand))
		?? fetchOne(sageCommand, createHandlers());
}

export async function fetchCores(sageCommand: SageCommand): Promise<FetchResult<PathbuilderCharacterCore>[]> {
	const results: FetchResult<PathbuilderCharacterCore>[] = [];

	const byId = await fetchByPathbuilderId(sageCommand);
	if (byId) {
		results.push(byId);
	}

	results.push(...await fetchAll(sageCommand, createHandlers()));

	return results;
}
