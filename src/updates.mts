import { existsSync, readdir, readFile, rmSync, writeFile } from "fs";

//#region helpers

function cleanJson(object: any): boolean {
	let changed = false;
	Object.keys(object as any).forEach(key => {
		if (!exists(object[key])) {
			delete object[key];
			changed = true;
		}else if (typeof(object[key]) === "object") {
			changed ||= cleanJson(object[key]);
		}
	});
	return changed;
}

function exists<T>(value?: T | null | undefined): value is T {
	return value !== null && value !== undefined;
}

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

function save<T extends IdCore>(core: TPair<T>): Promise<true> {
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

function rename<T extends IdCore>(core: TPair<T>): Promise<true> {
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

//#region channels

type IChannel = {
	did: string;
	commands?: boolean;
	dialog?: boolean;
	dice?: boolean;
	gameChannelType?: GameChannelType;
}

// type TGameChannelType = keyof typeof GameChannelType;
enum GameChannelType { None = 0, InCharacter = 1, OutOfCharacter = 2, GameMaster = 3, Miscellaneous = 4, Dice = 5 }

/** @deprecated */
type THasAdminSearch = {
	/** @deprecated */
	admin: boolean;
	/** @deprecated */
	search: boolean;
}
function removeAdminSearch(channel: IChannel & Partial<THasAdminSearch>): boolean {
	let changed = "admin" in channel || "search" in channel;

	if (channel.admin || channel.search) {
		channel.commands = true;
	}

	delete channel.admin;
	delete channel.search;

	return changed;
}

/** @deprecated */
type THasGameMasterPlayerNonPlayer = {
	/** @deprecated */
	gameMaster: number;
	/** @deprecated */
	player: number;
	/** @deprecated */
	nonPlayer: number;
}

function removeGameMasterPlayerNonPlayer(channel: IChannel & Partial<THasGameMasterPlayerNonPlayer>): boolean {
	let changed = "gameMaster" in channel || "player" in channel || "nonPlayer" in channel;

	if (!exists(channel.gameChannelType)) {
		const gameMaster = channel.gameMaster;
		const player = channel.player;
		const nonPlayer = channel.nonPlayer;

		if (exists(gameMaster) || exists(player) || exists(nonPlayer)) {
			const gmWrite = channel.gameMaster === 3;
			const pcWrite = channel.player === 3;
			const bothWrite = gmWrite && pcWrite;

			const dialog = channel.dialog === true;
			const commands = channel.commands === true;

			const gm = gmWrite && !pcWrite;
			const ooc = bothWrite && (!dialog || commands);
			const ic = bothWrite && !ooc && dialog;
			const misc = !ic && !ooc && !gm;

			let type: GameChannelType | undefined;
			if (ic) type = GameChannelType.InCharacter;
			if (gm) type = GameChannelType.GameMaster;
			if (ooc) type = GameChannelType.OutOfCharacter;
			if (misc) type = GameChannelType.Miscellaneous;
			channel.gameChannelType = type;
		}
	}

	delete channel.gameMaster;
	delete channel.player;
	delete channel.nonPlayer;

	return changed;
}

/** @deprecated */
type THasSendCommandToSendSearchTo = {
	/** @deprecated */
	sendCommandTo: string;
	/** @deprecated */
	sendSearchTo: string;
}

function removeSendCommandToSendSearchTo(channel: IChannel & Partial<THasSendCommandToSendSearchTo>): boolean {
	let changed = "sendCommandTo" in channel || "sendSearchTo" in channel;

	delete channel.sendCommandTo;
	delete channel.sendSearchTo;

	return changed;
}

function cleanChannelCore_v1(channel: IChannel): boolean {
	let changed = false;
	changed ||= removeGameMasterPlayerNonPlayer(channel);
	changed ||= cleanJson(channel);
	return changed;
}

function cleanChannelCore_v2(channel: IChannel): boolean {
	let changed = false;
	changed ||= removeAdminSearch(channel);
	changed ||= removeSendCommandToSendSearchTo(channel);
	changed ||= cleanJson(channel);
	return changed;
}

//#endregion

//#region main processing

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
type IdCore = { id:string; }
type DidCore = IdCore & { did:string; }
type TPair<T extends IdCore> = { type:string; id:string; did:string; path:string; json:T; parentPath?:string; };
async function readFiles<T extends IdCore>(type: string): Promise<TPair<T>[]> {
	const out: TPair<T>[] = [];
	const typePath = `${sagePath}/${type}`;
	const files = await listFiles(typePath, "json");
	for (const file of files) {
		const id = file.slice(0, -5);
		const path = `${typePath}/${file}`;
		const json = await readJsonFile<T>(path);
		if (json) {
			const did = (json as IdCore as DidCore).did;
			out.push({ type, id, did, path, json  });
		}else {
			console.warn(`\t\tInvalid JSON file: ${typePath}/${id}.json`);
		}
	}
	return out;
}

type TUpdateHandler<T extends IdCore> = (core: TPair<T>) => Promise<[string, number] | null>;
async function updateType<T extends IdCore>(type: string, handlers: TUpdateHandler<T>[]):  Promise<[string, number][]> {
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

async function update<T extends IdCore>(type: string, handler: TUpdateHandler<T>): Promise<[string, number][]> {
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

//#endregion

//#region bots

async function updateBots(): Promise<[string, number][]> {
	return updateType("bots", [updateBots_v1, updateBots_v2]);
}

type BotCore_v1 = DidCore & {
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

//#region characters

type CharacterCore_v2 = IdCore & {
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

type GameCore_v1 = IdCore & {
	channels?: IChannel[];
};

type GameCore_v2 = IdCore & {
	channels?: IChannel[];
};

async function updateGames(): Promise<[string, number][]> {
	return updateType("games", [updateGames_v1, updateGames_v2]);
}

async function updateGames_v1(game: TPair<GameCore_v1>): Promise<[string, number] | null> {
	let changes = 0;

	//#region update channels
	let channelChanges = 0;
	game.json.channels?.forEach(channel => {
		if (cleanChannelCore_v1(channel)) {
			channelChanges++;
		}
	});
	if (channelChanges) {
		console.log(`\t\t${game.id}: channel cleanup.`);
		changes += channelChanges;
	}
	//#endregion

	if (changes) {
		save(game);
	}

	return [game.id, changes];
}

async function updateGames_v2(game: TPair<GameCore_v2>): Promise<[string, number] | null> {
	let changes = 0;

	//#region update channels
	let channelChanges = 0;
	game.json.channels?.forEach(channel => {
		if (cleanChannelCore_v2(channel)) {
			channelChanges++;
		}
	});
	if (channelChanges) {
		console.log(`\t\t${game.id}: channel cleanup.`);
		changes += channelChanges;
	}
	//#endregion

	if (changes) {
		save(game);
	}

	return [game.id, changes];
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

// type ServerCore_v1 = DidCore & {
// };

async function updateServers_v1(): Promise<[string, number] | null> {
	return null;
}

type ServerCore_v2 = DidCore & {
	channels?: IChannel[];
};

async function updateServers_v2(server: TPair<ServerCore_v2>): Promise<[string, number] | null> {
	let changes = 0;

	//#region update channels
	let channelChanges = 0;
	server.json.channels?.forEach(channel => {
		if (cleanChannelCore_v2(channel)) {
			channelChanges++;
		}
	});
	if (channelChanges) {
		console.log(`\t\t${server.id}: channel cleanup.`);
		changes += channelChanges;
	}
	//#endregion

	if (changes) {
		save(server);
	}

	//#region rename
	if (server.id !== server.json.did && !isNonNilSnowflake(server.id)) {
		const renamed = await rename(server);
		if (!renamed) throw new Error(`Unable to rename: ${server.path}`);
		changes++;
	}
	//#endregion

	return [server.did, changes];
}

//#endregion

//#region users

async function updateUsers(): Promise<[string, number][]> {
	return updateType("users", [updateUsers_v1, updateUsers_v2]);
}

type UserCore_v1 = DidCore & {
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
