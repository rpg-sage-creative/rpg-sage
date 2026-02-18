import { addCommas } from "@rsc-utils/core-utils";
import { rollDie } from "@rsc-utils/random-utils";
import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import type { SageCommand } from "../../model/SageCommand.js";

let DiceRegExp: RegExp;

type ParseDiceInputResults = { iterations:number; dieSize:number; };

function parseDiceInput(sageCommand: SageCommand): ParseDiceInputResults | undefined {
	// ensure we have an arg to work with
	const input = sageCommand.args.getString("dice")
		?? sageCommand.args.getString("die")
		?? sageCommand.args.getString("sides")
		?? sageCommand.args.getString("type");
	if (!input) return undefined;

	// ensure we have regexp to work with
	DiceRegExp ??= /(?:(?<count>\d+)?d)?(?<sides>\d+)/i;

	// parse input vs regexp
	const { count = "", sides = "" } = DiceRegExp.exec(input)?.groups ?? { };

	// get dieSize and test against valid
	const dieSize = +sides;
	if (![2,3,4,6,8,10,12,20,100].includes(dieSize)) return undefined;

	// make sure we have between 1 and maxIterations
	const maxIterations = 10000;
	const iterations = Math.max(0, Math.min(+count || maxIterations)) || maxIterations;

	return { iterations, dieSize };
}

async function rollDiceAsync(count: number, sides: number): Promise<number[]> {
	const rolls = new Array<number>(count);
	for (let i = 0; i < count; i++) {
		rolls[i] = await Promise.resolve(rollDie(sides));
	}
	return rolls;
}

async function diceTest(sageCommand: SageCommand): Promise<void> {
	//#region validate command

	if (!sageCommand.allowDice) {
		// denyByProv
		const details = [
			"<b>Dice Test</b>",
			"This channel does not allow that!",
			"<i>Dice not allowed in this channel.</i>"
		];
		await sageCommand.replyStack.whisper(details.join("\n"));
		return;
	}

	if (sageCommand.game && !sageCommand.actor.isGameUser && !sageCommand.canAdminGame) {
		// denyForGame
		const details = [
			"<b>Dice Test</b>",
			"Must be a GameMaster or Player for this game or a GameAdmin, Administrator, Manager, or Owner of this server."
		];
		await sageCommand.replyStack.whisper(details.join("\n"));
		return;
	}

	const inputs = parseDiceInput(sageCommand);
	if (!inputs) {
		const sagePrefix = sageCommand.server?.getPrefixOrDefault() ?? "";
		const details = [
			"The basic command for testing dice is:",
			"> ```" + sagePrefix + "! dice test sides=\"20\"```",
			"<i>Valid values for `sides` are: 2, 3, 4, 6, 8, 10, 12, 20</i>"
		];
		await sageCommand.replyStack.whisper(details.join("\n"));
		return;
	}


	//#endregion

	const { iterations, dieSize } = inputs;

	const rolls = await rollDiceAsync(iterations, dieSize);

	const results = mapDiceTestResults({ dieSize, iterations, rolls });

	//#region count streaks

	const singleValueStreaksRaw = [] as { result:number; streaks:number[]; }[];
	const highLowStreaksRaw = [] as { high:boolean; low:boolean; streak:number[]; }[];
	const lowCutoff = dieSize / 2;

	results.rolls.forEach((roll, index, rolls) => {
		//#region single value
		const singleValueStreaks = singleValueStreaksRaw[roll] ?? (singleValueStreaksRaw[roll] = { result:roll, streaks:[] });
		if (rolls[index - 1] === roll) {
			singleValueStreaks.streaks[singleValueStreaks.streaks.length - 1] += 1;
		}else {
			singleValueStreaks.streaks.push(1);
		}
		//#endregion
		//#region high low
		const high = roll > lowCutoff;
		const last = highLowStreaksRaw[highLowStreaksRaw.length - 1];
		const streak = last?.high === high ? last : { high, low:!high, streak:[] };
		if (last !== streak) {
			highLowStreaksRaw.push(streak);
		}
		streak.streak.push(roll);
		//#endregion
	});

	//#region single value
	const singleValueStreaks = singleValueStreaksRaw.reduce((out, roll) => {
			roll?.streaks.forEach(length => {
				if (length > 1) {
					addStreakLength(out[roll.result] ?? (out[roll.result] = { }), length);
				}
			});
			return out;
		}, { } as { [roll: number]: TStreakLengths });
	//#endregion

	//#region high low
	const highLowStreaks = highLowStreaksRaw.reduce((out, streak) => {
		if (streak.streak.length > 1) {
			addStreakLength(out[streak.high ? "high" : "low"], streak.streak.length);
		}
		return out;
	}, { high:{} as TStreakLengths, low:{} as TStreakLengths });
	//#endregion

	//#endregion

	//#region map counts

	const expectedAvg = Math.round(iterations / dieSize);
	const expectedAvgLen = addCommas(expectedAvg).length;
	const mappedCounts = results.counts.map((dieCount, dieRoll) => {
		const die = addCommas(dieRoll).padStart(2, " ");
		const count = addCommas(dieCount).padStart(expectedAvgLen, " ");
		const delta = dieCount - expectedAvg;
		const cDelta = addCommas(delta);
		const sDelta = delta < 0 ? cDelta : `+${cDelta}`;
		return { die, count, delta, cDelta, sDelta };
	}).slice(1);
	const highLowCounts = results.counts.reduce((out, dieCount, dieRoll) => {
		if (dieRoll) {
			out[dieRoll > lowCutoff ? "high" : "low"] += dieCount;
		}
		return out;
	}, { high:0, low:0 });

	//#endregion

	const maxDelta = mappedCounts.reduce((max, count) => Math.max(Math.abs(count.delta), max), 0);

	//#region create output

	const ticks = "```";

	const blockSize = dieSize === 100 ? 20 : dieSize;
	const blocks = dieSize / blockSize;
	const blockIndexes = (blockIndex: number) => {
		const startDieIndex = blockIndex * blockSize;
		const endDieIndex = startDieIndex + blockSize;
		return { startDieIndex, endDieIndex };
	};

	let output = `**Test Results: d${dieSize} x${addCommas(iterations)}**`;
	for (let blockIndex = 0; blockIndex < blocks; blockIndex++) {
		const { startDieIndex, endDieIndex } = blockIndexes(blockIndex);
		output += "\n" + ticks;
		mappedCounts.slice(startDieIndex, endDieIndex).forEach(count => {
			const sDeltaBar = createDeltaBar(maxDelta, count.delta);
			output += `\n${count.die}: ${count.count} ${sDeltaBar} (${count.sDelta})`;
		});
		output += ticks;
	}
	output += ticks;
	output += `high: ${addCommas(highLowCounts["high"])}`;
	output += "\n\n";
	output += `low: ${addCommas(highLowCounts["low"])}`;
	output += ticks;

	output += "\n**Streaks**";
	for (let blockIndex = 0; blockIndex < blocks; blockIndex++) {
		const { startDieIndex, endDieIndex } = blockIndexes(blockIndex);
		output += "\n*Roll: Length (xCount)*";
		output += "\n" + ticks;
		let last = -1;
		for (let dieIndex = startDieIndex; dieIndex < endDieIndex; dieIndex++) {
			const die = dieIndex + 1;
			const streakKeys = Object.keys(singleValueStreaks[die] ?? {}).filter(key => key !== "max");
			if (streakKeys.length) {
				output += `\n${die}: `;
				output += streakKeys.map(key => `${key} (x${singleValueStreaks[die][key as any]})`).join(", ");
				last = streakKeys.length;
			}else if (last !== 0) {
				output += "\n\u2026";
				last = 0;
			}
		}
		output += ticks;
	}
	output += ticks;
	(["high", "low"] as ("high" | "low")[]).forEach(hl => {
		if (hl === "low") output += "\n\n"
		output += `${hl}: `;
		output += Object.keys(highLowStreaks[hl] ?? {}).filter(key => key !== "max").map(key => `${key} (x${highLowStreaks[hl][key as any]})`).join(", ");
	});
	output += ticks;

	//#endregion

	await sageCommand.replyStack.send(output);
}

type TStreakLengths = { [length: number]:number; max?:number; };
function addStreakLength(lengths: TStreakLengths, length: number): void {
	const max = lengths.max;
	lengths[length] = (lengths[length] ?? 0) + 1;
	if (!max || length > max) {
		lengths.max = length;
	}
}

function createDeltaBar(biggestDelta: number, delta: number): string {
	if (delta !== 0) {
		const deltaPercent = (delta < 0 ? -1 : 1) * Math.round(100 * Math.abs(delta) / biggestDelta);
		if (deltaPercent < -80) return `-----0     `;
		if (deltaPercent < -60) return ` ----0     `;
		if (deltaPercent < -40) return `  ---0     `;
		if (deltaPercent < -20) return `   --0     `;
		if (deltaPercent < 0)   return `    -0     `;
		if (deltaPercent > 80)  return `     0+++++`;
		if (deltaPercent > 60)  return `     0++++ `;
		if (deltaPercent > 40)  return `     0+++  `;
		if (deltaPercent > 20)  return `     0++   `;
		if (deltaPercent > 0)   return `     0+    `;
	}
	return `     0     `;
}

type TDiceTestResults = {
	counts: number[];
	dieSize: number;
	iterations: number;
	minCount: number;
	maxCount: number;
	rolls: number[];
};

function mapDiceTestResults({ dieSize, iterations, rolls }: { dieSize: number; iterations: number; rolls: number[]; }): TDiceTestResults {
	const counts = rolls.reduce((out, value) => {
		out[value] = (out[value] ?? 0) + 1;
		return out;
	}, [] as number[]);
	const [minCount, maxCount] = counts.reduce((minMax, count) => {
		minMax[0] = Math.min(minMax[0] ?? 0, count);
		minMax[1] = Math.max(minMax[1] ?? 0, count);
		return minMax;
	}, [] as number[]);
	return {
		counts, dieSize, iterations, minCount, maxCount, rolls
	};
}

export function registerDiceTest(): void {
	registerListeners({ commands:["dice|test"], message:diceTest });
}