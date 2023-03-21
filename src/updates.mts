import { existsSync, readdir, readFile, rmSync, writeFile } from "fs";

//#region helpers

function isNonNilSnowflake(value: string): boolean {
	return !!value.match(/^\d{16,}$/) && !value.match(/^0{16,}$/);
}

function listFiles(path: string, ext?: string): Promise<string[]> {
	return new Promise((resolve, reject) => {
		if (existsSync(path)) {
			readdir(path, (error: NodeJS.ErrnoException | null, files: string[]) => {
				if (error) {
					reject(error);
				}else {
					if (ext) {
						const fileExt = `.${ext}`;
						resolve(files.filter(file => file.endsWith(fileExt)));
					}else {
						resolve(files);
					}
				}
			});
		}else {
			console.warn(`Invalid path: ${path}`);
			resolve([]);
		}
	});
}

function readJsonFile<T>(path: string): Promise<T | null> {
	return new Promise((resolve, reject) => {
		readFile(path, null, (error: NodeJS.ErrnoException | null, buffer: Buffer) => {
			if (error) {
				reject(error);
			}else if (Buffer.isBuffer(buffer)) {
				let object: T | null | undefined;
				try {
					object = JSON.parse(buffer.toString("utf8"));
				}catch(ex) {
					reject(ex);
				}
				if (object !== undefined) {
					resolve(object as T);
				}else {
					// In case we didn't reject an exception somehow, we don't want the Promise to hang ...
					reject("Unable to parse!");
				}
			}else {
				reject("Not a Buffer");
			}
		});
	});
}

function save<T extends TCore>(core: TPair<T>): Promise<true> {
	return new Promise((resolve, reject) => {
		if (live) {
			writeFile(core.path, JSON.stringify(core.json), error => {
				if (error) {
					reject(error);
				}else {
					resolve(true);
				}
			});
		}else {
			console.log(`WRITE FILE: ${core.path}`);
			resolve(true);
		}
	});
}

function rename<T extends TCore>(core: TPair<T>): Promise<true> {
	return new Promise((resolve, reject) => {
		const oldPath = core.path;
		if (core.parentPath) {
			core.path = `${core.parentPath}/${core.did ?? core.id}.json`;
		}else {
			core.path = oldPath.replace(core.id, core.did);
		}
		if (live) {
			save(core).then(() => {
				rmSync(oldPath);
				resolve(true);
			}).catch(reject);
		}else {
			console.log(`RENAME FILE: ${oldPath} => ${core.path}`);
			resolve(true);
		}
	});
}

//#endregion

async function processUpdates(): Promise<void> {
	console.log(`Checking for data file updates ...`);
	const changes: [string, number][] = [];
	const updateFns = [updateBots, updateCharacters, updateGames, updateMaps, updateMessages, updateServers, updateUsers];
	for (const updateFn of updateFns) {
		const updates = await updateFn();
		changes.push(...updates);
	}
	const totalChanges = changes.reduce((count, change) => count += change[1], 0);
	const totalFiles = changes.map(change => change[0]).filter((s, i, a) => a.indexOf(s) === i).length;
	console.log(`Total updates: ${totalChanges} (${totalFiles} files)`);
}

const sagePath = `./data/sage`;
type TCore = { id:string; did:string; }
type TPair<T extends TCore> = { type:string; id:string; did:string; path:string; json:T; parentPath?:string; };
async function readFiles<T extends TCore>(type: string): Promise<TPair<T>[]> {
	const out: TPair<T>[] = [];
	const typePath = `${sagePath}/${type}`;
	const files = await listFiles(typePath, "json");
	for (const file of files) {
		const id = file.slice(0, -5);
		const path = `${typePath}/${file}`;
		const json = await readJsonFile<T>(path);
		if (json) {
			const did = json.did;
			out.push({ type, id, did, path, json });
		}else {
			console.warn(`\t\tInvalid JSON file: ${typePath}/${id}.json`);
		}
	}
	return out;
}

type TUpdateHandler<T extends TCore> = (core: TPair<T>) => Promise<[string, number] | null>;
async function updateType<T extends TCore>(type: string, handlers: TUpdateHandler<T>[]):  Promise<[string, number][]> {
	const singular = type.endsWith("s") ? type.slice(0, -1) : type;
	console.log(`\tChecking for ${singular} file updates ...`);
	const changes: [string, number][] = [];
	for (const handler of handlers) {
		const updates = await update(type, handler);
		changes.push(...updates);
	}
	const totalChanges = changes.reduce((count, change) => count += change[1], 0);
	const totalFiles = changes.map(change => change[0]).filter((s, i, a) => a.indexOf(s) === i).length;
	console.log(`\tTotal ${singular} updates: ${totalChanges} (${totalFiles} files)`);
	return changes;

}

async function update<T extends TCore>(type: string, handler: TUpdateHandler<T>): Promise<[string, number][]> {
	const changes: [string, number][] = [];
	const cores = await readFiles<T>(type);
	for (const core of cores) {
		const updates = await handler(core);
		if (updates) {
			changes.push(updates);
		}
	}
	return changes;
}

//#region bots

async function updateBots(): Promise<[string, number][]> {
	return updateType("bots", [updateBots_v1, updateBots_v2]);
}

type BotCore_v1 = TCore & {
	devs: {
		did: string;
		logLevel: string;
		/** @deprecated */
		channelDids?:[];
	}[];
}

/**
 * ensure devs array
 * remove .channels dev entries
 */
async function updateBots_v1(bot: TPair<BotCore_v1>): Promise<[string, number] | null> {
	let changes = 0;
	const json = bot.json;

	//#region ensure devs includes Randal
	if (!json.devs) {
		json.devs = [{ did:"253330271678627841", logLevel:"Error" }];
		console.log(`\t\t${bot.id}: devs added.`);
		changes++;
	}
	//#endregion

	//#region remove channels from devs
	for (const dev of json.devs) {
		if (dev.channelDids) {
			delete dev["channelDids"];
			console.log(`\t\t${bot.id}: channelDids removed.`);
			changes++;
		}
	};
	//#endregion

	if (changes) {
		save(bot);
	}

	return [bot.did, changes];
}

/**
 * rename files to did.json
 */
async function updateBots_v2(bot: TPair<BotCore_v1>): Promise<[string, number] | null> {
	if (bot.id !== bot.json.did && !isNonNilSnowflake(bot.id)) {
		const renamed = await rename(bot);
		if (!renamed) throw new Error(`Unable to rename: ${bot.path}`);
		return [bot.did, 1];
	}
	return null;
}

//#endregion

//#region games

type CharacterCore_v2 = TCore & {
	sheet: { macroUserId:string; };
}

async function updateCharacters(): Promise<[string, number][]> {
	return updateType("characters", [updateCharacters_v1, updateCharacters_v2]);
}

async function updateCharacters_v1(): Promise<[string, number] | null> {
	return null;
}

async function updateCharacters_v2(char: TPair<CharacterCore_v2>): Promise<[string, number] | null> {
	// set parentPath and save?
	console.log({id:char.id,did:char.did,userId:char.json.sheet?.macroUserId})
	return null;
}

//#endregion

//#region games

async function updateGames(): Promise<[string, number][]> {
	return updateType("games", [updateGames_v1, updateGames_v2]);
}

async function updateGames_v1(): Promise<[string, number] | null> {
	return null;
}

async function updateGames_v2(): Promise<[string, number] | null> {
	return null;
}

//#endregion

//#region maps

async function updateMaps(): Promise<[string, number][]> {
	return updateType("maps", [updateMaps_v1, updateMaps_v2]);
}

async function updateMaps_v1(): Promise<[string, number] | null> {
	return null;
}

async function updateMaps_v2(): Promise<[string, number] | null> {
	return null;
}

//#endregion

//#region messages

async function updateMessages(): Promise<[string, number][]> {
	return updateType("messages", [updateMessages_v1, updateMessages_v2]);
}

async function updateMessages_v1(): Promise<[string, number] | null> {
	return null;
}

async function updateMessages_v2(): Promise<[string, number] | null> {
	return null;
}

//#endregion

//#region servers

async function updateServers(): Promise<[string, number][]> {
	return updateType("servers", [updateServers_v1, updateServers_v2]);
}

type ServerCore_v1 = TCore & {
};

async function updateServers_v1(): Promise<[string, number] | null> {
	return null;
}

async function updateServers_v2(server: TPair<ServerCore_v1>): Promise<[string, number] | null> {
	if (server.id !== server.json.did && !isNonNilSnowflake(server.id)) {
		const renamed = await rename(server);
		if (!renamed) throw new Error(`Unable to rename: ${server.path}`);
		return [server.did, 1];
	}
	return null;
}

//#endregion

//#region users

async function updateUsers(): Promise<[string, number][]> {
	return updateType("users", [updateUsers_v1, updateUsers_v2]);
}

type UserCore_v1 = TCore & {
};

async function updateUsers_v1(): Promise<[string, number] | null> {
	return null;
}

async function updateUsers_v2(user: TPair<UserCore_v1>): Promise<[string, number] | null> {
	if (user.id !== user.json.did && !isNonNilSnowflake(user.id)) {
		const renamed = await rename(user);
		if (!renamed) throw new Error(`Unable to rename: ${user.path}`);
		return [user.did, 1];
	}
	return null;

}

//#endregion

const live = false;
processUpdates();
