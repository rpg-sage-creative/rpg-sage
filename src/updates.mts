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

//#region bots

async function updateBots(): Promise<number> {
	let total = 0;
	console.log(`\tChecking for bot file updates ...`);
	total += await updateBots_v1();
	total += await updateBots_v1_1();
	console.log(`\tTotal bot file updates: ${total}`);
	return total;
}

async function updateBots_v1(): Promise<number> {
	return 0;
}

async function updateBots_v1_1(): Promise<number> {
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