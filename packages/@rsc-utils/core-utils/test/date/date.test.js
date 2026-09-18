import { getDateStrings, getDayNames, getDayOfYear, getDaysInMonth, getDaysPerMonth, getMonthNames } from "../../build/index.js";

describe("date", () => {

	test(`getDayNames()`, () => {
		expect(getDayNames()).toStrictEqual(['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']);
	});

	test(`getMonthNames()`, () => {
		expect(getMonthNames()).toStrictEqual(['January','February','March','April','May','June','July','August','September','October','November','December']);
	});

	test(`getDateStrings()`, () => {
		const input = new Date(1978, 11, 24, 19, 45);
		const output = {year:'1978',month:'12',day:'24',hours:'19',minutes:'45',seconds:'00',milli:'000',date:'1978-12-24',time:'19:45:00.000',dateTime:'1978-12-24 19:45:00.000'};
		expect(getDateStrings(input)).toStrictEqual(output);
	});

	test(`getDaysPerMonth() and getDaysInMonth()`, () => {
		const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		expect(getDaysPerMonth()).toStrictEqual(daysPerMonth);
		daysPerMonth.forEach((days, month) => expect(getDaysInMonth(month)).toBe(days));
	});

	test(`getDayOfYear()`, () => {
		expect(getDayOfYear(new Date(2023, 0, 1))).toBe(1);
		expect(getDayOfYear(new Date(2023, 0, 1, 19, 45))).toBe(1);

		// non-leap year
		expect(getDayOfYear(new Date(2023, 11, 31))).toBe(365);
		expect(getDayOfYear(new Date(2023, 11, 31, 19, 45))).toBe(365);

		// leap year
		expect(getDayOfYear(new Date(2024, 11, 31))).toBe(366);
	});

	test.todo("Create a more complete suite of tests.");
});
