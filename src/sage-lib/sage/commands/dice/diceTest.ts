import { addCommas } from "@rsc-utils/core-utils";
import { rollDie } from "@rsc-utils/dice-utils";
import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import type { SageCommand } from "../../model/SageCommand.js";

async function diceTest(sageCommand: SageCommand): Promise<void> {
	//#region validate command

	if (!sageCommand.allowDice) {
		await sageCommand.replyStack.reply("*Dice not allowed in this channel!*");
		return;
	}
	if (sageCommand.game && !(sageCommand.isGameMaster || sageCommand.isPlayer)) {
		await sageCommand.replyStack.reply("*Only members of this game allowed!*");
		return;
	}

	const dieValue = sageCommand.args.getString("die") ?? sageCommand.args.getString("sides") ?? sageCommand.args.getString("type");
	if (!dieValue) {
		await sageCommand.replyStack.reply("*Die type not given!*");
		return;
	}

	const dieSize = +dieValue.replace(/\D/g, "");
	if (![2,3,4,6,8,10,12,20].includes(dieSize)) {
		await sageCommand.replyStack.reply("*Die type not valid! (2, 3, 4, 6, 8, 10, 12, 20)*");
		return;
	}

	//#endregion

	const iterations = 10000;

	//#region roll dice

	const rolls: number[] = [];
	let counter = iterations;
	do {
		rolls.push(rollDie(dieSize));
	} while(--counter);

	//#endregion

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

	let output = `**Test Results: d${dieSize} x${addCommas(iterations)}**\n\`\`\``;
	mappedCounts.forEach(count => {
		const sDeltaBar = createDeltaBar(maxDelta, count.delta);
		output += `\n${count.die}: ${count.count} ${sDeltaBar} (${count.sDelta})`;
	});
	(["high", "low"] as ("high" | "low")[]).forEach(hl => {
		output += `\n\n${hl}: ${addCommas(highLowCounts[hl])}`;
	});
	output += "```\n**Streaks**\n*Roll: Length (xCount)*```";
	for (let i = 1; i <= dieSize; i++) {
		output += `\n${i}: `;
		output += Object.keys(singleValueStreaks[i]).filter(key => key !== "max").map(key => `${key} (x${singleValueStreaks[i][key as any]})`).join(", ");
	}
	(["high", "low"] as ("high" | "low")[]).forEach(hl => {
		output += `\n\n${hl}: `;
		output += Object.keys(highLowStreaks[hl]).filter(key => key !== "max").map(key => `${key} (x${highLowStreaks[hl][key as any]})`).join(", ");
	});
	output += "```";

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