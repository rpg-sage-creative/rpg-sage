import { listFiles, readJsonFile, readJsonFiles, writeFileSync } from "@rsc-utils/io-utils";

const PATH = `/Users/randaltmeyer/tmp/data/sage`;

const now = Date.now();

function msToDaysOld(ms) {
	const days = (now - ms) / 1000 / 60 / 60 / 24;
	return Math.floor(days);
	// return Math.round(10 * days) / 10;
}

let games = [];
async function loadGames() { games = await readJsonFiles(PATH + "/games"); }

let users = [];
async function loadUsers() { users = await readJsonFiles(PATH + "/users"); }

function findCharType({ gameId, characterId, userDid }) {
	const game = gameId ? games.find(game => game.id === gameId) : undefined;
	if (gameId && !game) console.log({gameId})
	if (game?.nonPlayerCharacters?.find(npc => npc.id === characterId)) return "npc";
	if (game?.playerCharacters?.find(pc => pc.id === characterId)) return "pc";
	const user = users.find(user => user.did === userDid || user.id === userDid);
	// if (!user) console.log({userDid});
	if (user?.nonPlayerCharacters?.find(npc => npc.id === characterId)) return "npc";
	if (user?.playerCharacters?.find(pc => pc.id === characterId)) return "pc";
	return "gm";
}

function findUserType({ gameId, userDid }) {
	const user = games.find(game => game.id === gameId)?.users.find(user => user.did === userDid);
	return user?.type === 2 ? "gamemaster" : "player";
}

function createSets(keys) { const sets = { messages:0 }; keys.forEach(key => sets[key] = new Set()); return sets; }
function createData(...keys) { return { total:createSets(keys), week:createSets(keys) }; }

let sageData = undefined;
function getSageData() { return sageData ?? (sageData = createData("servers", "games", "users", "characters", "channels", "gamemasters", "players", "pcs", "npcs" /*, "gms"*/)); }

const serverIds = {
	"601578527263031302": "Cayden's Keg",
	"857970340385783828": "Knights of Last Call",
	"706661999907569694": "Find the Path",
	"337024788323106817": "Roll for Combat",
	"480488957889609733": "RPG Sage"
};
const serverData = { };
function getServerData(serverId) { return serverData[serverId] ?? (serverData[serverId] = createData("games", "users", "characters", "channels", "gamemasters", "players", "pcs", "npcs" /*, "gms"*/)); }

const userIds = { };
const userData = { };
function getUserData(userId) { return userData[userId] ?? (userData[userId] = createData("servers", "games", "characters", "channels", "pcs", "npcs" /*, "gms"*/)); }

function countSets(sets) { return Object.keys(sets).reduce((out, key) => { out[key] = sets[key].size ?? sets[key]; return out; }, { }); }
function countData(data) { return Object.keys(data).reduce((out, key) => { out[key] = ["total","week"].includes(key) ? countSets(data[key]) : data[key]; return out; }, { }); }

/** record a key/value pair in the given data object */
function recordMessageDataItem(data, key, value, age) {
	if (key === "messages") {
		data.total.messages++;
		if (age < 7) data.week.messages++;
	}else if (data.total[key]) {
		data.total[key].add(value);
		if (age < 7) data.week[key].add(value);
	}
}

/** record the given message in the given data object */
function recordMessageData(data, age, { userDid, characterId, messageDid, serverDid, gameId, threadDid, channelDid }) {
	const record = (key, value) => recordMessageDataItem(data, key, value, age);
	record("messages", messageDid);
	record("users", userDid);
	record("characters", characterId);
	record("servers", serverDid);
	record("games", gameId);
	switch(findCharType({ gameId, characterId, userDid })) {
		// case "gm": record("gms", characterId); break;
		case "pc": record("pcs", characterId); break;
		case "npc": record("npcs", characterId); break;
		default: console.log({ what:"findCharType", gameId, characterId, userDid }); break;
	}
	switch(findUserType({ gameId, userDid })) {
		case "gamemaster": record("gamemasters", userDid); break;
		case "player": record("players", userDid); break;
		default: console.log({ what:"findUserType", gameId, userDid }); break;
	}
	if (threadDid) record("channels", threadDid);
	else if (channelDid) record("channels", channelDid);
}

/** record the given message with all possible data objects */
function recordMessage(msg) {
	if (!msg.userDid || !msg.serverDid) return;

	const age = msToDaysOld(msg.timestamp);
	recordMessageData(getSageData(), age, msg);
	recordMessageData(getServerData(msg.serverDid), age, msg);
	recordMessageData(getUserData(msg.userDid), age, msg);
}

function sortedBy(data, totalOrWeek) {
	const keys = Object.keys(data);
	const values = keys.map(key => ({ ...data[key], name:serverIds[key]??userIds[key]??key }));
	values.sort((a, b) => {
		const _a = a[totalOrWeek].messages;
		const _b = b[totalOrWeek].messages;
		return _a < _b ? 1 : _a > _b ? -1 : 0;
	});
	return values.map((value, index) => ({
		name: value.name,
		rank: index + 1,
		...countData(value)[totalOrWeek]
	}));
}

async function processMessages() {
	const path = `${PATH}/messages`;
	const files = await listFiles(path, "json");
	let noUser = 0;
	let noServer = 0;
	let oldestValid = 0;
	for (const file of files) {
		const msg = await readJsonFile(`${path}/${file}`);
		recordMessage(msg);
		if (!msg.userDid) noUser++;
		else if (!msg.serverDid) noServer++;
		else oldestValid = Math.max(oldestValid, msToDaysOld(msg.timestamp));
	}
	writeFileSync(`./leader-board/sage.json`, countData(sageData), true, true);
	writeFileSync(`./leader-board/server.total.json`, sortedBy(serverData, "total"), true, true);
	writeFileSync(`./leader-board/server.week.json`, sortedBy(serverData, "week"), true, true);
	writeFileSync(`./leader-board/user.total.json`, sortedBy(userData, "total"), true, true);
	writeFileSync(`./leader-board/user.week.json`, sortedBy(userData, "week"), true, true);
}

async function main() {
	await loadGames();
	await loadUsers();
	await processMessages();
	const ms = Date.now() - now;
	console.log(`Time elapsed: ${Math.round(ms / 100) / 10} seconds`);
	// writeFileSync(`./counts.json`, counts, true, true);
	// const output = [];
	// output.push(`## RPG Sage Activity: This Week (total)`);
	// output.push(`### Dialog Posts: ${counts.thisWeek.messages} (${counts.totals.messages} total)`);
	// output.push(`- Users: ${counts.thisWeek.users} (${counts.totals.users} total)`);
	// output.push(`- Characters: ${counts.thisWeek.characters} (${counts.totals.characters} total)`);
	// output.push(`- Servers: ${counts.thisWeek.servers} (${counts.totals.servers} total)`);
	// output.push(`- Games: ${counts.thisWeek.games} (${counts.totals.games} total)`);
	// output.push(`- Channels: ${counts.thisWeek.channels} (${counts.totals.channels} total)`);
	// // output.push(`### Games Created: ${all[1].thisWeek} (${all[1].count} total)`);
	// console.info(output.join("\n"));
}
main();

/*
## Raw Sage Stats
> These numbers are raw, likely including early test info as well as duplicates from user learning, trial, and error.
### Total Essence20 Characters Imported
- 42
- most recent: 307 days ago
### Total Games Created
- 1982
- most recent: today
- this week: 151
### Total Maps Created
- 432
- most recent: 16 days ago
### Total Dialog Messages Sent
- 275,610
- most recent: today
- this week: 6,782
### Total Pathfinder/Starfinder 2e Characters Imported
- 2,452
- most recent: today
- this week: 27
### Total Server Metadata Files
- 1,409
- most recent: today
- this week: 36
### Total User Metadata Files
- 470
- most recent: today
- this week: 38
*/
