import { enableLogLevels, pause, tagLiterals } from "@rsc-utils/core-utils";
import { DdbRepo } from "../../../build/index.js";
import { getJsonObjects } from "./data.js";

/*

400 KB max json size in DDB

*/

enableLogLevels("development");

/** @type {DdbRepo | undefined} */
let _ddbRepo;

/** @type {Promise<DdbRepo>} */
let _ddbRepoPromise;

async function initDdbRepo() {
	if (_ddbRepo) return _ddbRepo;
	if (_ddbRepoPromise) return _ddbRepoPromise;
	return _ddbRepoPromise = new Promise(async (resolve, reject) => {
		_ddbRepo = new DdbRepo(DdbRepo.DdbClientConfig);

		let connected;
		do {
			// pause a split second
			await pause(250);
			// try to list tables
			connected = await _ddbRepo.testConnection();
		}while (!connected);

		resolve(_ddbRepo);
	});
}

async function initDdbTable(objectType) {
	const ddbRepo = await initDdbRepo();
	return ddbRepo.for(objectType);
}

/** @type {number | undefined} */
let timeout = undefined; // default
// timeout = 10 * 1000; // 10 seconds

// let the container finish starting
beforeAll(initDdbRepo);

describe("aws", () => {
	describe("ddb", () => {
		describe("DdbRepo", () => {

			const objectTypes = ["Bot", "Game", "Server"];
			const jsonObjects = getJsonObjects(...objectTypes);
			const idKeys = jsonObjects.map(({ id, objectType }) => ({ id, objectType }));
			const getDdbTable = (objectType) => initDdbTable(objectType);

			describe(`Create Test Tables`, () => {
				test(JSON.stringify(objectTypes), async () => {
					for (const objectType of objectTypes) {
						const ddbTable = await getDdbTable(objectType);
						expect(await ddbTable.ensure()).toBeDefined();
					}
				}, timeout);
			});

			describe(`Batch Item Commands`, () => {

				const expectedGetNoneResults = {
					batchCount: Math.ceil(jsonObjects.length / DdbRepo.BatchGetMaxItemCount),
					errorCount: 0,
					items: jsonObjects.map(() => undefined)
				};

				const expectedSaveAllResults = {
					batchCount: Math.ceil(jsonObjects.length / DdbRepo.BatchPutMaxItemCount),
					errorCount: 0,
					unprocessed: [],
					success: true,
					partial: false
				};

				const expectedGetAllResults = {
					batchCount: Math.ceil(jsonObjects.length / DdbRepo.BatchGetMaxItemCount),
					errorCount: 0,
					items: jsonObjects
				};

				const expectedGetAllResultsReversed = {
					batchCount: Math.ceil(jsonObjects.length / DdbRepo.BatchGetMaxItemCount),
					errorCount: 0,
					items: jsonObjects.slice().reverse()
				};

				const expectedDeleteAllResults = {
					batchCount: Math.ceil(jsonObjects.length / DdbRepo.BatchPutMaxItemCount),
					errorCount: 0,
					unprocessed: [],
					success: true,
					partial: false
				};

				test(tagLiterals`ddbRepo.save(...) --> ${expectedSaveAllResults}`, async () => {
					const ddbRepo = await initDdbRepo();
					// show they aren't there
					expect(await ddbRepo.get(idKeys)).toStrictEqual(expectedGetNoneResults);
					// save them
					expect(await ddbRepo.save(jsonObjects)).toStrictEqual(expectedSaveAllResults);
					// show they are there
					expect(await ddbRepo.get(idKeys)).toStrictEqual(expectedGetAllResults);
				}, timeout);

				test(`ddbRepo.get(...)`, async () => {
					const ddbRepo = await initDdbRepo();
					// reverse list and fetch
					const reversedKeys = idKeys.slice().reverse();
					// show the results are ordered as the keys
					expect(await ddbRepo.get(reversedKeys)).toStrictEqual(expectedGetAllResultsReversed);
				}, timeout);

				test(tagLiterals`DdbRepo.delete(...) --> ${expectedDeleteAllResults}`, async () => {
					const ddbRepo = await initDdbRepo();
					// show they are there
					expect(await ddbRepo.get(jsonObjects)).toStrictEqual(expectedGetAllResults);
					// delete them
					expect(await ddbRepo.delete(jsonObjects)).toStrictEqual(expectedDeleteAllResults);
					// show they aren't there
					expect(await ddbRepo.get(idKeys)).toStrictEqual(expectedGetNoneResults);
				}, timeout);

			});

			describe(`Drop Test Tables`, () => {
				test(JSON.stringify(objectTypes), async () => {
					for (const objectType of objectTypes) {
						const ddbTable = await getDdbTable(objectType);
						expect(await ddbTable.drop()).toBe(true);
					}
				}, timeout);
			});

		});
	});
});

afterAll(async () => {
	_ddbRepo?.destroy();
});