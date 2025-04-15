import { debug, enableLogLevels, isNonNilSnowflake, pause, randomSnowflake, toLiteral } from "@rsc-utils/core-utils";
import { readdirSync } from "fs";
import { DdbRepo, isDirSync, readJsonFilesSync } from "../../build/index.js";

//#region core updates

function updateMessageCore(core) {
	if ("messageDid" in core) {
		if ("discordKey" in core) debug(core);
		return {
			channelId: isNonNilSnowflake(core.threadDid) ? core.threadDid : core.channelDid,
			characterId: core.characterId,
			gameId: core.gameId,
			guildId: core.serverDid,
			id: core.messageDid,
			messageIds: [core.messageDid],
			timestamp: core.timestamp,
			userId: core.userDid
		};
	}
	return core;
}

//#endregion

/*

MAKE THE TABLES WITH YEAR IN THE NAME ??
IDS ARE SNOWFLAKES SO I CAN GET THE YEAR AND KNOW WHICH TABLE TO QUERY ??
(shouldn't need to, but this could be a solution to growing table sizes)

400 KB max json size in DDB

*/

enableLogLevels("development");

// let the container finish starting
beforeAll(async () => {
	let connected;
	do {
		// pause a split second
		await pause(250);
		// try to list tables
		connected = await DdbRepo.testConnection();
	}while (!connected);
});

const dataRoot = "/Users/randaltmeyer/git/rsc/rpg-sage/docker-volumes/rpg-sage-mono/sage";

function getObjectTypes() {
	return ["bots"];
	return readdirSync(dataRoot).filter(dirName => isDirSync(`${dataRoot}/${dirName}`));
}

function getJsonFiles(objectType) {
	const path = `${dataRoot}/${objectType}`;
	const files = readJsonFilesSync(path).map(json => {
		if (objectType === "message") json = updateMessageCore(json);
		const bytes = Buffer.byteLength(JSON.stringify(json));
		const tooBig = bytes > 400 * 1024;
		return { json, bytes, tooBig };
	});
	return { objectType, path, files };
}

describe("ddb", () => {
	describe("DdbRepo", () => {

		const objectTypes = getObjectTypes();
		objectTypes.forEach(objectType => {
			describe(objectType, () => {

				const objectTypeMeta = getJsonFiles(objectType);
				const jsonObjects = objectTypeMeta.files.map(fileMeta => fileMeta.json);

				// ensure ddb table exists
				test(`DdbRepo.for:: ${toLiteral(objectType)}`, async () => {
					expect(await DdbRepo.for(objectType)).toBeDefined();
				});

				// test("drop", async () => expect(await DdbRepo.drop(objectType)).toBe(true));

				// return;

				test(`DdbRepo.saveAll:: ${toLiteral(objectType)}`, async () => {
					expect(await DdbRepo.saveAll(jsonObjects)).toBe(true);
				});

				test(`DdbRepo.getBy:: ${toLiteral(objectType)}`, async () => {
					const fetched = await DdbRepo.getBy(jsonObjects);
					expect(fetched.length).toStrictEqual(jsonObjects.length);
				});

				test(`DdbRepo.deleteAll:: ${toLiteral(objectType)}`, async () => {
					expect(await DdbRepo.deleteAll(jsonObjects)).toBe(true);
				});

			});
		});

	});
});
