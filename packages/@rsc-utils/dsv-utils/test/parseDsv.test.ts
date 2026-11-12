import { describe, expect, test } from "vitest";
import { parseDsv } from "../build/index.js";

const keys = [`a`, `b`, `c`, `d`];
const values = [
	[`1`, `one`, `"o n e"`, `"o,n e"`],
	[`2`, `two`, `"t w o"`, `"t,w|o"`],
	[`3`, `three`, `"t h r e e"`, `"t,h|r\te e"`]
];

const table = (delimiter: string) => [keys, ...values].map(line => line.join(delimiter)).join("\n");

const commaData = table(`,`);
const pipeData = table(`|`);
const tabData = table(`\t`);

const strippedValues = values.map(line => { const o = { }; line.forEach((value, index) => o[keys[index]] = value.replace(/"/g, "")); return o; });

describe("parseDsv", () => {

	describe("auto-detected delimiters", () => {

		test(`detects comma delimited data`, async () => {
			expect(await parseDsv(commaData)).toStrictEqual({ delimiter:",", keys, items:strippedValues });
		});

		test(`detects pipe delimited data`, async () => {
			expect(await parseDsv(pipeData)).toStrictEqual({ delimiter:"|", keys, items:strippedValues });
		});

		test(`detects tab delimited data`, async () => {
			expect(await parseDsv(tabData)).toStrictEqual({ delimiter:"\t", keys, items:strippedValues });
		});

		test(`detects semicolon delimited data (beyond the typed DsvDelimiter)`, async () => {
			expect(await parseDsv(`a;b\n1;2`)).toStrictEqual({ delimiter:";", keys:[`a`, `b`], items:[{ a:`1`, b:`2` }] });
		});

	});

	describe("explicit delimiters", () => {

		test(`parseDsv(commaData, ",") matches data`, async () => {
			expect(await parseDsv(commaData, `,`)).toStrictEqual({ delimiter:",", keys, items:strippedValues });
		});

		test(`parseDsv(pipeData, "|") matches data`, async () => {
			expect(await parseDsv(pipeData, `|`)).toStrictEqual({ delimiter:"|", keys, items:strippedValues });
		});

		test(`parseDsv(tabData, "\\t") matches data`, async () => {
			expect(await parseDsv(tabData, `\t`)).toStrictEqual({ delimiter:"\t", keys, items:strippedValues });
		});

		test(`csv-parser options objects are passed through`, async () => {
			expect(await parseDsv(pipeData, { separator:`|` })).toStrictEqual({ delimiter:"|", keys, items:strippedValues });
		});

	});

	describe("wrong explicit delimiters produce no columns", () => {

		test(`parseDsv(commaData, "|") is undefined`, async () => {
			expect(await parseDsv(commaData, `|`)).toBeUndefined();
		});

		test(`parseDsv(commaData, "\\t") is undefined`, async () => {
			expect(await parseDsv(commaData, `\t`)).toBeUndefined();
		});

		test(`parseDsv(pipeData, ",") is undefined`, async () => {
			expect(await parseDsv(pipeData, `,`)).toBeUndefined();
		});

		test(`parseDsv(pipeData, "\\t") is undefined`, async () => {
			expect(await parseDsv(pipeData, `\t`)).toBeUndefined();
		});

		test(`parseDsv(tabData, ",") is undefined`, async () => {
			expect(await parseDsv(tabData, `,`)).toBeUndefined();
		});

		test(`parseDsv(tabData, "|") is undefined`, async () => {
			expect(await parseDsv(tabData, `|`)).toBeUndefined();
		});

	});

	describe("input types", () => {

		test(`accepts Buffer input`, async () => {
			expect(await parseDsv(Buffer.from(`a,b\n1,2`))).toStrictEqual({ delimiter:",", keys:[`a`, `b`], items:[{ a:`1`, b:`2` }] });
		});

		test(`rejects with RangeError for number input`, async () => {
			await expect(parseDsv(42 as unknown as string)).rejects.toThrow(RangeError);
		});

		test(`rejects with RangeError for null input`, async () => {
			await expect(parseDsv(null as unknown as string)).rejects.toThrow(RangeError);
		});

		test(`rejects with RangeError for undefined input`, async () => {
			await expect(parseDsv(undefined as unknown as string)).rejects.toThrow(RangeError);
		});

	});

	describe("insufficient columns", () => {

		test(`single column data is undefined`, async () => {
			expect(await parseDsv(`a\nb\nc`)).toBeUndefined();
		});

		test(`header-only data still returns keys with no items`, async () => {
			expect(await parseDsv(`a,b\n`)).toStrictEqual({ delimiter:",", keys:[`a`, `b`], items:[] });
		});

		test(`missing trailing newline is fine`, async () => {
			expect(await parseDsv(`a,b`)).toStrictEqual({ delimiter:",", keys:[`a`, `b`], items:[] });
		});

		test(`short rows omit the missing keys`, async () => {
			expect(await parseDsv(`a,b\n1,2\n3`)).toStrictEqual({ delimiter:",", keys:[`a`, `b`], items:[{ a:`1`, b:`2` }, { a:`3` }] });
		});

	});

});
