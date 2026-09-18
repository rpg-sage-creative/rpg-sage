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
	return _ddbRepoPromise = new Promise(async resolve => {
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
		describe("DdbTable // Single Item Commands", () => {

			//#region variables

			const objectType = "Character";
			const jsonObjects = getJsonObjects(objectType);
			const getDdbTable = () => initDdbTable(objectType);

			//#endregion

			test(`ddbTable.ensure()`, async () => {
				const ddbTable = await getDdbTable();
				expect(await ddbTable.ensure()).toBe(true);
			}, timeout);

			test(`ddbTable.save(item): [new] (${jsonObjects.length} items`, async() => {
				const ddbTable = await getDdbTable();
				for (const json of jsonObjects) {
					// initial json get/save/get
					expect(await ddbTable.get(json.id)).toBeUndefined();
					expect(await ddbTable.save(json)).toBe(true);
					expect(await ddbTable.get(json.id)).toStrictEqual(json);
				}
			}, timeout);

			test(`ddbTable.save(item): [update] (${jsonObjects.length} items)`, async() => {
				const ddbTable = await getDdbTable();
				for (const json of jsonObjects) {

					// alter the object and make sure it doesn't match the ddbTable
					const objectTypeTwo = (json.objectType ?? "None").split("").reverse().join("");
					const clone = { ...json, objectTypeTwo };

					// confirm clone id matches
					expect(json.id).toBe(clone.id);

					// confirm clone object is different
					expect(json).not.toStrictEqual(clone);
					expect(await ddbTable.get(clone.id)).not.toStrictEqual(clone);

					// save the clone successfully
					expect(await ddbTable.save(clone)).toBe(true);

					// refetch the clone and make sure it doesn't match original
					const fetched = await ddbTable.get(json.id);
					expect(fetched).toStrictEqual(clone);
					expect(fetched).not.toStrictEqual(json);
				};
			}, timeout);

			test(`ddbTable.delete(id) (${jsonObjects.length} items)`, async() => {
				const ddbTable = await getDdbTable();
				for (const json of jsonObjects) {
					// delete and confirm
					expect(await ddbTable.delete(json.id)).toBe(true);
					expect(await ddbTable.get(json.id)).toBeUndefined();
				};
			}, timeout);

			test(`ddbTable.drop()`, async () => {
				const ddbTable = await getDdbTable();
				expect(await ddbTable.drop()).toBe(true);
			}, timeout);

		});

		describe("DdbTable // Batch Commands", () => {

			//#region variables

			const objectType = "Message";
			const jsonObjects = getJsonObjects(objectType);
			const ids = jsonObjects.map(({ id }) => id);
			const getDdbTable = () => initDdbTable(objectType);

			const expectedGetNoneResults = jsonObjects.map(() => undefined);

			const expectedSaveAllResults = {
				batchCount: Math.ceil(jsonObjects.length / DdbRepo.BatchPutMaxItemCount),
				errorCount: 0,
				unprocessed: [],
				success: true,
				partial: false
			};

			const expectedGetAllResults = jsonObjects;

			const expectedGetAllResultsReversed = jsonObjects.slice().reverse();

			const expectedDeleteAllResults = {
				batchCount: Math.ceil(jsonObjects.length / DdbRepo.BatchPutMaxItemCount),
				errorCount: 0,
				unprocessed: [],
				success: true,
				partial: false
			};

			//#endregion

			test(`ddbTable.ensure()`, async () => {
				const ddbTable = await getDdbTable();
				expect(await ddbTable.ensure()).toBe(true);
			}, timeout);

			test(tagLiterals`ddbTable.save(...) --> ${expectedSaveAllResults}`, async () => {
				const ddbTable = await getDdbTable();
				// show they aren't there
				expect(await ddbTable.get(ids)).toStrictEqual(expectedGetNoneResults);
				// save them
				expect(await ddbTable.save(jsonObjects)).toBe(true);
				// show they are there
				expect(await ddbTable.get(ids)).toStrictEqual(expectedGetAllResults);
			}, timeout);

			test(tagLiterals`ddbTable.forEachAsync(fn)`, async () => {
				const ddbTable = await getDdbTable();
				await ddbTable.forEachAsync(async (value, index, array) => {
					expect(ids.includes(value.id)).toBe(true);
				});
			}, timeout);

			test(`ddbTable.get(...)`, async () => {
				const ddbTable = await getDdbTable();
				// reverse list and fetch
				const reversedIds = ids.slice().reverse();
				// show the results are ordered as the keys
				expect(await ddbTable.get(reversedIds)).toStrictEqual(expectedGetAllResultsReversed);
			}, timeout);

			test(tagLiterals`ddbTable.delete(...) --> ${expectedDeleteAllResults}`, async () => {
				const ddbTable = await getDdbTable();
				// show they are there
				expect(await ddbTable.get(ids)).toStrictEqual(expectedGetAllResults);
				// delete them
				expect(await ddbTable.delete(ids)).toBe(true);
				// show they aren't there
				expect(await ddbTable.get(ids)).toStrictEqual(expectedGetNoneResults);
			}, timeout);

			test(`ddbTable.drop()`, async () => {
				const ddbTable = await getDdbTable();
				expect(await ddbTable.drop()).toBe(true);
			}, timeout);

		});
	});
});

afterAll(async () => {
	_ddbRepo?.destroy();
});