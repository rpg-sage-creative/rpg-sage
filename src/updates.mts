import { listFiles, readJsonFile } from "./sage-utils/utils/FsUtils";

async function processUpdates(): Promise<void> {
	console.log(`Checking for data file updates ...`);
	let total = 0;
	total += await updateBots();
	total += await updateCharacters();
	total += await updateGames();
	total += await updateMaps();
	total += await updateMessages();
	total += await updateServers();
	total += await updateUsers();
	console.log(`Total data file updates: ${total}`);
}

const sagePath = `./data/sage`;
type TPair<T> = { id:string; path:string; json:T; };
async function readFiles<T>(what: string): Promise<TPair<T>[]> {
	const out: TPair<T>[] = [];
	const ids = await listFiles(`${sagePath}/${what}`, "json");
	for (const id of ids) {
		const path = `${sagePath}/${what}/${id}.json`;
		const json = await readJsonFile<T>(path);
		if (json) {
			out.push({ id, path, json });
		}else {
			console.warn(`\t\tInvalid JSON file: ${sagePath}/${what}/${id}.json`);
		}
	}
	return out;
}

//#region bots

async function updateBots(): Promise<number> {
	let total = 0;
	console.log(`\tChecking for bot file updates ...`);
	total += await updateBots_v1();
	total += await updateBots_v2();
	console.log(`\tTotal bot file updates: ${total}`);
	return total;
}

type BotCore_v1 = {
	devs: {
		did: string;
		logLevel: string;
		/** @deprecated */
		channelDids?:[];
	}[];
}

async function updateBots_v1(): Promise<number> {
	let changes = 0;
	const bots = await readFiles<BotCore_v1>("bot");
	for (const bot of bots) {
		let changed = false;
		const json = bot.json;

		// remove channels from devs
		if (!json.devs) {
			json.devs = [{ did:"253330271678627841", logLevel:"Error" }];
			console.log(`\t\t${bot.id}: devs added.`);
			changed = true;
		}
		for (const dev of json.devs) {
			if (dev.channelDids) {
				delete dev["channelDids"];
			console.log(`\t\t${bot.id}: channelDids removed.`);
			changed = true;
			}
		};

		if (changed) {
			changes++;
		}
	}
	return changes;
}

async function updateBots_v2(): Promise<number> {
	return 0;
}

//#endregion

//#region games

async function updateCharacters(): Promise<number> {
	let total = 0;
	console.log(`\tChecking for character file updates ...`);
	total += await updateCharacters_v1();
	total += await updateCharacters_v1_1();
	console.log(`\tTotal character file updates: ${total}`);
	return total;
}

async function updateCharacters_v1(): Promise<number> {
	return 0;
}

async function updateCharacters_v1_1(): Promise<number> {
	return 0;
}

//#endregion

//#region games

async function updateGames(): Promise<number> {
	let total = 0;
	console.log(`\tChecking for game file updates ...`);
	total += await updateGames_v1();
	total += await updateGames_v1_1();
	console.log(`\tTotal game file updates: ${total}`);
	return total;
}

async function updateGames_v1(): Promise<number> {
	return 0;
}

async function updateGames_v1_1(): Promise<number> {
	return 0;
}

//#endregion

//#region maps

async function updateMaps(): Promise<number> {
	let total = 0;
	console.log(`\tChecking for map file updates ...`);
	total += await updateMaps_v1();
	total += await updateMaps_v1_1();
	console.log(`\tTotal map file updates: ${total}`);
	return total;
}

async function updateMaps_v1(): Promise<number> {
	return 0;
}

async function updateMaps_v1_1(): Promise<number> {
	return 0;
}

//#endregion

//#region messages

async function updateMessages(): Promise<number> {
	let total = 0;
	console.log(`\tChecking for message file updates ...`);
	total += await updateMessages_v1();
	total += await updateMessages_v1_1();
	console.log(`\tTotal message file updates: ${total}`);
	return total;
}

async function updateMessages_v1(): Promise<number> {
	return 0;
}

async function updateMessages_v1_1(): Promise<number> {
	return 0;
}

//#endregion

//#region servers

async function updateServers(): Promise<number> {
	let total = 0;
	console.log(`\tChecking for server file updates ...`);
	total += await updateServers_v1();
	total += await updateServers_v1_1();
	console.log(`\tTotal server file updates: ${total}`);
	return total;
}

async function updateServers_v1(): Promise<number> {
	return 0;
}

async function updateServers_v1_1(): Promise<number> {
	return 0;
}

//#endregion

//#region users

async function updateUsers(): Promise<number> {
	let total = 0;
	console.log(`\tChecking for user file updates ...`);
	total += await updateUsers_v1();
	total += await updateUsers_v1_1();
	console.log(`\tTotal user file updates: ${total}`);
	return total;
}

async function updateUsers_v1(): Promise<number> {
	return 0;
}

async function updateUsers_v1_1(): Promise<number> {
	return 0;
}

//#endregion

processUpdates();