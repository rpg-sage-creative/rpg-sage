import utils from "../../build/sage-utils";

// node --experimental-modules --es-module-specifier-resolution=node run.mjs

export default function testRandomUtils() {
	// 1000 iterations wasn't enough to always hit all 1s or all 4s in 5d4!!!!
	const testIterations = 10000;

	//#region .random()

	function testRandom() {
		const values = [[-2, 2], [0, 23], [1, 5], [1, 25], [1, 100], [2, 5], [12, 25], [23, 100]];
		values.forEach(([min, max]) => {
			const map = new Map();
			let i = testIterations;
			while (i--) {
				const randomValue = min === 1 ? utils.RandomUtils.random(max) : utils.RandomUtils.random(min, max);
				if (!map.has(randomValue)) map.set(randomValue, 1);
				else map.set(randomValue, map.get(randomValue) + 1);
			}
			const call = min === 1 ? `random(${max})` : `random(${min}, ${max})`;
			for (let val = min; val <= max; val++) {
				console.assert(map.has(val), `Result ${val} missing from ${testIterations} of ${call}`);
			}
			const keys = Array.from(map.keys());
			const unwantedKeys = keys.filter(key => typeof(+key) !== "number" || key < min || key > max);
			console.assert(unwantedKeys.length === 0, `Unexpected results from ${call}: ${unwantedKeys}`);
			const minResult = Math.min(...keys);
			console.assert(minResult === min, `Min result of ${call} is ${minResult} instead of ${min}`);
			const maxResult = Math.max(...keys);
			console.assert(maxResult === max, `Max result of ${call} is ${maxResult} instead of ${max}`);
		});
	}

	testRandom();

	//#endregion

	//#region .randomBoolean()

	function testRandomBoolean() {
		const map = new Map();
		let i = testIterations;
		while (i--) {
			const randomValue = utils.RandomUtils.randomBoolean();
			if (!map.has(randomValue)) map.set(randomValue, 1);
			else map.set(randomValue, map.get(randomValue) + 1);
		}
		console.assert(map.has(true), `Result true missing from ${testIterations} of randomBoolean()`);
		console.assert(map.has(false), `Result false missing from ${testIterations} of randomBoolean()`);
		const keys = Array.from(map.keys());
		const unwantedKeys = keys.filter(key => key !== true && key !== false);
		console.assert(unwantedKeys.length === 0, `Unexpected results from ${testIterations} of randomBoolean(): ${unwantedKeys}`);
	}

	testRandomBoolean();

	//#endregion

	//#region .randomItem()

	function testRandomItem() {
		const map = new Map();
		const values = ["a", 2, { three:"FOUR" }, "five", 6, "7"];
		let i = testIterations;
		while (i--) {
			const randomValue = utils.RandomUtils.randomItem(values);
			if (!map.has(randomValue)) map.set(randomValue, 1);
			else map.set(randomValue, map.get(randomValue) + 1);
		}
		const call = `randomItem(values = ["a", 2, { three:"FOUR" }, "five", 6, "7"])`;
		for (const val of values) {
			console.assert(map.has(val), `Result ${JSON.stringify(val)} missing from ${testIterations} of ${call}`);
		}
		const keys = Array.from(map.keys());
		const unwantedKeys = keys.filter(key => values.indexOf(key) < 0);
		console.assert(unwantedKeys.length === 0, `Unexpected results from ${testIterations} of ${call}: ${unwantedKeys}`);
	}

	testRandomItem();

	//#endregion

	//#region .randomItems()

	function testRandomItems() {
		const values = ["a", "b", "c", 1, 2, 3, { y:"z" }];
		const args = [[1], [2], [3, true], [10], [10, true]];
		args.forEach(([count, unique]) => {
			const call = `randomItems(values = ["a", "b", "c", 1, 2, 3, { y:"z" }], count = ${count}, unique = ${unique})`;
			const map = new Map();
			let i = testIterations;
			while (i--) {
				const randomSelections = utils.RandomUtils.randomItems(values, count, unique);
				console.assert(randomSelections.length === (unique ? Math.min(count, values.length) : count), `Incorrect results length of ${call}`);
				if (unique) {
					console.assert(randomSelections.length === randomSelections.filter(utils.ArrayUtils.Filters.unique).length, `Expected unique values from ${call}`);
				}
				randomSelections.forEach(randomValue => {
					if (!map.has(randomValue)) map.set(randomValue, 1);
					else map.set(randomValue, map.get(randomValue) + 1);
				});
			}
			for (const val of values) {
				console.assert(map.has(val), `Result ${JSON.stringify(val)} missing from ${testIterations} of ${call}`);
			}
			const keys = Array.from(map.keys());
			const unwantedKeys = keys.filter(key => values.indexOf(key) < 0);
			console.assert(unwantedKeys.length === 0, `Unexpected results from ${testIterations} of ${call}: ${unwantedKeys}`);
		});
	}

	testRandomItems();

	//#endregion

	//#region .randomRoll()

	function testRandomRoll() {
		const validValues = [["-1d6", -6, -1], ["-2d6-2", -14, -4], ["1d6", 1, 6], ["+1d6", 1, 6], ["1d8+1", 2, 9], ["1d20-3", -2, 17], ["3d6", 3, 18], ["5d4+1", 6, 21], ["2d20-3", -1, 37]];
		validValues.forEach(([diceString, min, max]) => {
			const call = `randomRoll("${diceString}")`;
			const map = new Map();
			let i = testIterations;
			while (i--) {
				const randomValue = utils.RandomUtils.randomRoll(diceString);
				if (!map.has(randomValue)) map.set(randomValue, 1);
				else map.set(randomValue, map.get(randomValue) + 1);
			}
			for (let val = min; val <= max; val++) {
				console.assert(map.has(val), `Result ${val} missing from ${testIterations} of ${call}`);
			}
			const keys = Array.from(map.keys());
			const unwantedKeys = keys.filter(key => typeof(+key) !== "number" || key < min || key > max);
			console.assert(unwantedKeys.length === 0, `Unexpected results from ${call}: ${unwantedKeys}`);
			const minResult = Math.min(...keys);
			console.assert(minResult === min, `Min result of ${call} is ${minResult} instead of ${min}`);
			const maxResult = Math.max(...keys);
			console.assert(maxResult === max, `Max result of ${call} is ${maxResult} instead of ${max}`);
		});
		const invalidValues = [["0d1"], ["1d0"]];
		invalidValues.forEach(([diceString]) => {
			console.assert(utils.RandomUtils.randomRoll(diceString) === null, `Expected a null result: ${diceString}`);
		});
	}

	testRandomRoll();

	//#endregion

	//#region .shuffle()

	function testShuffle() {
		const call = `shuffle(values = ["a", 2, { three:"FOUR" }, "five", 6, "7"])`;
		const values = ["a", 2, { three:"FOUR" }, "five", 6, "7"];
		const sortedValuesJson = JSON.stringify(values.slice().sort());
		let iteration = testIterations;
		while (iteration--) {
			const shuffled = utils.RandomUtils.shuffle(values);
			const shuffledJson = JSON.stringify(shuffled);
			const sortedShuffledJson = JSON.stringify(shuffled.slice().sort());
			console.assert(sortedValuesJson === sortedShuffledJson, `Shuffled array has invalid values: ${sortedValuesJson} !== ${sortedShuffledJson}`);
			console.assert(shuffled.filter((val, i) => values[i] === val).length < shuffled.length, `No values changed locations! ${shuffledJson}`);
			const unwantedValues = shuffled.filter(val => values.indexOf(val) < 0);
			console.assert(unwantedValues.length === 0, `Unexpected results from ${testIterations} of ${call}: ${unwantedValues}`);
		}
	}

	testShuffle();

	//#endregion
}
