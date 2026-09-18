import { tagLiterals } from "@rsc-utils/core-utils";
import { parseDsv } from "../../build/index.js";

describe("string", () => {
	describe("dsv", () => {
		describe("parseDsv", () => {

			const keys = [`a`, `b`, `c`, `d`];
			const values = [
				[`1`, `one`, `"o n e"`, `"o,n e"`],
				[`2`, `two`, `"t w o"`, `"t,w|o"`],
				[`3`, `three`, `"t h r e e"`, `"t,h|r\te e"`]
			];
			const tableData = [keys, ...values];
			const baseResults = { keys, items:values.map(line => { const o = { }; line.forEach((value, index) => o[keys[index]] = value.replace(/"/g, "")); return o; }) };

			const ds = [",", "|", "\t"];
			ds.forEach(delimiter => {
				const testData = tableData.map(line => line.join(delimiter)).join("\n");
				const resultsData = { delimiter, ...baseResults };

				test(tagLiterals`parseDsv(${testData}) matches data`, async () => {
					expect(await parseDsv(testData)).toStrictEqual(resultsData);
				});

				ds.forEach(delim => {
					if (delim === delimiter) {
						// test specifying delimiter
						test(tagLiterals`parseDsv(${testData}, ${delim}) matches data`, async () => {
							expect(await parseDsv(testData, delim)).toStrictEqual(resultsData);
						});
						// test without delimiter to ensure it still matches the delimiter
						test(tagLiterals`parseDsv(${testData}) matches data`, async () => {
							expect(await parseDsv(testData)).toStrictEqual(resultsData);
						});
					}else {
						test(tagLiterals`parseDsv(${testData}, ${delim}) is undefined`, async () => {
							expect(await parseDsv(testData, delim)).toBeUndefined();
						});
					}
				});
			});

		});
	})
});