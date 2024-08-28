import { listFiles, readJsonFile, readJsonFiles } from "@rsc-utils/io-utils";
import { lstatSync } from "fs";

const PATH = `/Users/randaltmeyer/tmp/data/sage`;

async function readFiles(dir) { return readJsonFiles(PATH + "/" + dir); }

const now = Date.now();

function msToDaysOld(ms) {
	const days = (now - ms) / 1000 / 60 / 60 / 24;
	return Math.floor(days);
	// return Math.round(10 * days) / 10;
}

function checkStamp(filePath) {
	const stat = lstatSync(filePath);
	const age = msToDaysOld(stat.birthtimeMs);
	const read = msToDaysOld(stat.atimeMs);
	const updated = msToDaysOld(stat.mtimeMs);
	return { age, read, updated };
}

async function checkStamps(dir) {
	const path = `${PATH}/${dir}`;
	const files = await listFiles(path, "json");
	let oldest = 0, newest = 9999, thisWeek = 0;
	const stamps = files.map(file => {
		const stamp = checkStamp(`${path}/${file}`);
		oldest = Math.max(oldest, stamp.age);
		newest = Math.min(newest, stamp.age);
		if (stamp.age < 7) thisWeek++;
		return stamp;
	});
	return { stamps, oldest, newest, thisWeek };
}

async function processMessages() {
	const keys = new Set();
	const path = `${PATH}/messages`;
	const files = await listFiles(path, "json");
	const totals = { servers:new Set(), games:new Set(), users:new Set(), characters:new Set(), channels:new Set(), messages:new Set() };
	const thisWeek = { servers:new Set(), games:new Set(), users:new Set(), characters:new Set(), channels:new Set(), messages:new Set() };
	const add = (key, value, age) => { if (value) { totals[key].add(value); if (age < 7) thisWeek[key].add(value); } };
	let newestWithoutUserDid = 9999;
	for (const file of files) {
		const json = await readJsonFile(`${path}/${file}`);
		const age = msToDaysOld(json.timestamp);
		if (json.userDid) {
			add("users", json.userDid, age);
			add("characters", json.characterId, age);
			add("messages", json.messageDid, age);
			add("servers", json.serverDid, age);
			add("games", json.gameId, age);
			if (json.threadDid) add("channels", json.threadDid, age);
			else if (json.channelDid) add("channels", json.channelDid, age);
		}else newestWithoutUserDid = Math.min(newestWithoutUserDid, age)
		Object.keys(json).forEach(key => keys.add(key));
	}
	// console.info([...keys].sort());

	const counts = sets => ({ servers:sets.servers.size, games:sets.games.size, users:sets.users.size, characters:sets.characters.size, channels:sets.channels.size, messages:sets.messages.size });
	return {
		totals: counts(totals),
		thisWeek: counts(thisWeek),
		newestWithoutUserDid
	};
}

async function main() {
	const all = [];
	const dirs = ["e20", "games", "maps", "messages", "pb2e", "servers", "users"];
	for (const dir of dirs) {
		const { stamps, oldest, newest, thisWeek } = await checkStamps(dir);
		const count = stamps.length;
		all.push({ dir, count, newest, thisWeek });
	}
	console.info(all);
	const counts = await processMessages();
	console.info(counts);
	const output = [];
	output.push(`## RPG Sage Activity: This Week (total)`);
	output.push(`### Dialog Posts: ${counts.thisWeek.messages} (${counts.totals.messages} total)`);
	output.push(`- Users: ${counts.thisWeek.users} (${counts.totals.users} total)`);
	output.push(`- Characters: ${counts.thisWeek.characters} (${counts.totals.characters} total)`);
	output.push(`- Servers: ${counts.thisWeek.servers} (${counts.totals.servers} total)`);
	output.push(`- Games: ${counts.thisWeek.games} (${counts.totals.games} total)`);
	output.push(`- Channels: ${counts.thisWeek.channels} (${counts.totals.channels} total)`);
	output.push(`### Games Created: ${all[1].thisWeek} (${all[1].count} total)`);
	console.info(output.join("\n"));
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
