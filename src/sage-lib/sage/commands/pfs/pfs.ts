import { error, warn } from "@rsc-utils/console-utils";
import { capitalize } from "@rsc-utils/string-utils";
import _dice, { DieRollGrade } from "../../../../sage-dice";
import { Coins, PROFICIENCIES, Table, toModifier } from "../../../../sage-pf2e";
import type { RenderableContent } from "../../../../sage-utils/utils/RenderUtils";
import { ColorType } from "../../model/HasColorsCore";
import type SageMessage from "../../model/SageMessage";
import { createRenderableContent, registerCommandRegex } from "../cmd";
import { registerCommandHelp } from "../help";

export type TPfsFaction = "Horizon Hunters" | "Vigilant Seal" | "Envoys' Alliance" | "Grand Archive";

export function createPfsRenderableContent(sageMessage: SageMessage): RenderableContent {
	return createRenderableContent(sageMessage.getHasColors(), ColorType.PfsCommand);
}

type TIncomeRoll = {
	crit: boolean;
	success: boolean;
	dieResult: number;
	modifiedResult: number;
	days: number;
	incomePerDay: string;
};

function summaryForDays(incomeRolls: TIncomeRoll[], days: number): string {
	const summary = <string[]>[];
	const sum = new Coins();
	for (const roll of incomeRolls) {
		const rollDays = Math.min(roll.days, days);
		const coins = Coins.parse(roll.incomePerDay || "0 sp");
		summary.push(`${coins.toGpString()} x${rollDays}`);
		sum.add(coins.multiply(rollDays));
		days -= roll.days;
		if (days < 1) {
			break;
		}
	}
	return `${sum.toGpString()} (${summary.join(", ")})`;
}

// #region Earn Income
function earnIncome(sageMessage: SageMessage): void {
	const pcLevelString = sageMessage.args.shift()!;
	const proficiencyString = sageMessage.args.shift()!;
	const modifierString = sageMessage.args.shift()!;
	const daysString = sageMessage.args.shift()!;
	//this: Discord.Message, pcLevelString: string, proficiencyString: string, modifierString: string, daysString: string

	const renderable = createPfsRenderableContent(sageMessage),
		pcLevel = +pcLevelString,
		taskLevel = Math.max(0, pcLevel - 2),
		proficiencyLetter = capitalize(proficiencyString ?? "")[0],
		proficiencyLetterIndex = PROFICIENCIES.findIndex(_proficiency => _proficiency[0] === proficiencyLetter),
		proficiency = PROFICIENCIES[proficiencyLetterIndex],
		modifier = (modifierString.startsWith("-") ? -1 : 1) * +modifierString.match(/\d+/)![0],
		days = +daysString || 36;
	renderable.setTitle(`<b>Earn Income Roll</b>`);
	if (pcLevel < 1 || 20 < pcLevel) {
		renderable.append(`<blockquote>Invalid PC Level: ${pcLevelString}</blockquote>`);
	} else if (proficiencyLetterIndex < 0) {
		renderable.append(`<blockquote>Invalid Proficiency: ${proficiencyString}</blockquote>`);
	} else {
		const tableIncome = Table.findByNumber("4-2")!,
			levelRow = tableIncome.rows[taskLevel + 1],
			critRow = tableIncome.rows[taskLevel + 2],
			dc = +Table.findByNumber("10-5")!.rows[taskLevel + 1][1];

		renderable.append(`<b>PC Level</b> ${pcLevel}`);
		renderable.append(`<b>Skill Proficiency</b> ${proficiency}`);
		renderable.append(`<b>Skill Modifier</b> ${toModifier(modifier)}`);
		renderable.append(`<blockquote><b>Task Level</b> ${taskLevel}\n<b>Check DC</b> ${dc}\n<b>Roll</b> 1d20${toModifier(modifier)} >= ${dc}</blockquote>`);
		renderable.append(`<b>Possible Results</b>`);
		renderable.append(`<blockquote><b>Critical Failure</b> -\n<b>Failure</b> ${levelRow[1]}</blockquote>`);
		renderable.append(`<blockquote><b>Success</b> ${levelRow[1 + proficiencyLetterIndex]}\n<b>Critical Success</b> ${critRow[1 + proficiencyLetterIndex]}</blockquote>`);

		const rolls: TIncomeRoll[] = [];
		const dice = _dice.pf2e.Dice.parse(`1d20+${modifier}dc${dc}`);
		let dayCounter = days;
		do {
			const diceRoll = dice.roll();
			const roll = <TIncomeRoll>{
				crit: diceRoll.grade === DieRollGrade.CriticalFailure || diceRoll.grade === DieRollGrade.CriticalSuccess,
				success: diceRoll.grade === DieRollGrade.Success || diceRoll.grade === DieRollGrade.CriticalSuccess,
				dieResult: diceRoll.rolls[0].rolls[0],
				modifiedResult: diceRoll.total,
				days: 1,
				incomePerDay: "0 sp"
			};
			if (diceRoll.grade !== DieRollGrade.CriticalFailure) {
				roll.days = Math.min(dayCounter, 8);
				roll.incomePerDay = !roll.success ? levelRow[1] : roll.crit ? critRow[1 + proficiencyLetterIndex] : levelRow[1 + proficiencyLetterIndex];
			}
			rolls.push(roll);
			dayCounter -= roll.days;
		} while (dayCounter > 0);

		rolls.forEach((roll, rollIndex) => {
			renderable.append(`<b>Earn Income Check (${rollIndex + 1} of ${rolls.length})</b>`);
			renderable.append(`<blockquote><b>${roll.dieResult}</b>${toModifier(modifier)} = ${roll.modifiedResult} (${roll.crit ? "Critical " : ""}${roll.success ? "Success" : "Failure"}): ${roll.incomePerDay}/day</blockquote>`);
		});
		if (daysString) {
			renderable.append(`<u>Total Income</u>`);
			renderable.append(`<blockquote><b>${days} Days</b> ${summaryForDays(rolls, days)}</blockquote>`);
		} else {
			renderable.append(`<u>PFS Agent</u>`);
			renderable.append(`<blockquote><b>2 Days</b> ${summaryForDays(rolls, 2)}</blockquote>`);
			renderable.append(`<blockquote><b>8 Days</b> ${summaryForDays(rolls, 8)}</blockquote>`);
			renderable.append(`<blockquote><b>24 Days</b> ${summaryForDays(rolls, 24)}</blockquote>`);
			renderable.append(`<u>PFS Field-Commissioned Agent</u>`);
			renderable.append(`<blockquote><b>3 Days</b> ${summaryForDays(rolls, 3)}</blockquote>`);
			renderable.append(`<blockquote><b>12 Days</b> ${summaryForDays(rolls, 12)}</blockquote>`);
			renderable.append(`<blockquote><b>36 Days</b> ${summaryForDays(rolls, 36)}</blockquote>`);
		}
	}
	sageMessage.send(renderable);
}
function registerDowntime(): void {
	registerCommandRegex(/^\s*pfs\s*income\s*(\d{1,2})\s*(\w+)\s*([\+\-]?\d{1,2})(?:\s+(\d+)\s*(days)?)?\s*$/i, earnIncome);
	registerCommandHelp("PFS", "Downtime", `pfs income {pcLevel} {skillProficiency} {skillModifier}`);
	registerCommandHelp("PFS", "Downtime", `pfs income {pcLevel} {skillProficiency} {skillModifier} {days}`);
}
// #endregion Earn Income

// #region Links
// type TLink = { category: string; title: string; url: string; details: string[] };
// let links: TLink[] = [];
// function linkToUrl(link: TLink): string { return `<a href="${link.url}">${link.title}</a>`; }
// async function pfsLinks(sageMessage: SageMessage): Promise<void> {
// 	if (!links || !links.length) {
// 		links = await readJsonFile<TLink[]>("getDataRoot("pf2e")/json/links.json");
// 	}
// 	let renderableContent = createPfsRenderableContent(sageMessage);
// 	renderableContent.setTitle("<b>Helpful Links (Second Edition)</b>");

// 	let _pfsLinks = links.filter(link => link.category === "PFS").map(linkToUrl);
// 	renderableContent.append(`<b>Pathfinder Society</b>`, `${_pfsLinks[0]}<ul><li>${_pfsLinks.slice(1).join("</li><li>")}</li></ul>`);

// 	let commUseItems = links.filter(link => link.category === "CU").map(linkToUrl);
// 	renderableContent.appendTitledSection(`<b>Community Use</b>`, `<ul><li>${commUseItems.join("</li><li>")}</li></ul>`);

// 	sageMessage.send(renderableContent);
// }
// registerCommandRegex(/^\s*(pfs\s*)?links\s*$/, pfsLinks);
// registerCommandHelp("PFS", `pfs links`);
// #endregion Links

// #region Tier Calculator
function levelToPoints(level: number, tierMin: number, tierMax: number): number {
	if (level === tierMin) return 2;
	if (level === tierMin + 1) return 3;
	if (level === tierMax - 1) return 4;
	if (level === tierMax) return 6;
	warn(`levelToPoints(level: ${level}, tierMin: ${tierMin}, tierMax: ${tierMax})`);
	if (level < tierMin) return 2;
	if (tierMax < level) return 6;
	return 0;
}
function testRange(value: number, min: number, max: number): boolean {
	return min <= value && value <= max;
}
function pointsToSubTier(points: number): string {
	if (testRange(points, 8, 9)) return "Low Subtier";
	if (testRange(points, 10, 11)) return "Low Subtier (5-player adjustment)";
	if (testRange(points, 12, 13)) return "Low Subtier (6-player adjustment) OR Low Subtier (level bump)";
	if (testRange(points, 14, 15)) return "Low Subtier (5-player adjustment with level bump)";
	if (testRange(points, 16, 18)) return "High Subtier";
	if (testRange(points, 19, 22)) return "High Subtier (5-player adjustment)";
	if (testRange(points, 23, 27)) return "High Subtier (6-player adjustment) OR High Subtier (level bump)";
	if (testRange(points, 28, 32)) return "High Subtier (5-player adjustment with level bump)";
	if (testRange(points, 33, 42)) return "High Subtier (6-player adjustment with level bump)";
	warn(`pointsToSubTier(points: ${points})`);
	if (points < 8) return "Low Subtier";
	if (42 < points) return "High Subtier (6-player adjustment with level bump)";
	return "Unknown Subtier";
}
export type TTierInfo = {
	tier: string; tierMin: number; tierMax: number; invalidTier: boolean;
	pcLevels: number[]; pcCount: number; invalidLevel: boolean;
	pcLevelPoints: number[]; totalPoints: number;
	subtier: string; subtierText: string;
	lowTier: boolean; highTier: boolean;
}
function cleanPcLevels(pcLevelStrings: string[]): number[] {
	return pcLevelStrings.map(level => +String(level).replace(/\D/g, "")).filter(level => level);
}
function calculateTierInfo(tier: string, pcLevels: number[]): TTierInfo {
	const tierParts = tier.split(/-/),
		tierMin = +tierParts[0],
		tierMax = +tierParts[1] || +tierParts[0],
		pcLevelPoints = pcLevels.map(level => levelToPoints(level, tierMin, tierMax)),
		totalPoints = pcLevelPoints.reduce((total, levelPoints) => total + levelPoints, 0),
		subtierText = pointsToSubTier(totalPoints),
		lowTier = subtierText.startsWith("Low"),
		highTier = subtierText.startsWith("High");
	return {
		tier: tier,
		tierMin: tierMin,
		tierMax: tierMax,
		invalidTier: tierMin < 1 || tierMin !== tierMax - 3 || 20 < tierMax,
		pcLevels: pcLevels,
		pcCount: pcLevels.length,
		invalidLevel: !pcLevels.length || !!pcLevels.find(level => level < tierMin || tierMax < level),
		pcLevelPoints: pcLevelPoints,
		totalPoints: totalPoints,
		subtier: lowTier ? `${tierMin}-${tierMin + 1}` : `${tierMax - 1}-${tierMax}`,
		lowTier: lowTier,
		highTier: highTier,
		subtierText: subtierText
	};
}
function pfsTier(sageMessage: SageMessage): void {
	const tierString = sageMessage.args.shift()!;
	const pcLevelStrings = sageMessage.args;
	//this: Discord.Message, tierString: string, ...pcLevelStrings: string[]

	const tierInfo = calculateTierInfo(tierString, cleanPcLevels(pcLevelStrings)),
		renderableContent = createPfsRenderableContent(sageMessage);
	renderableContent.setTitle("<b>Subtier Calculator</b>");
	if (tierInfo.invalidTier) {
		renderableContent.append(`> <b>Invalid Tier</b> ${tierInfo.tier}`);
	}
	if (tierInfo.invalidLevel) {
		renderableContent.append(`> <b>Invalid Level(s)</b> ${tierInfo.pcLevels.join(", ")}`);
	}
	if (!(tierInfo.invalidTier || tierInfo.invalidLevel)) {
		renderableContent.append(`<b>Scenario/Quest Tier</b> ${tierInfo.tier}`);
		renderableContent.append(`<b>PC Count</b> ${tierInfo.pcCount}`);
		renderableContent.append(`<b>PC Levels</b> ${tierInfo.pcLevels.join(", ")}`);
		renderableContent.append(`<b>PC Level Points</b> ${tierInfo.pcLevelPoints.join(", ")}`);
		renderableContent.append(`<b>Total Points</b> ${tierInfo.totalPoints}`);
		renderableContent.append(`<b>SubTier</b> ${tierInfo.subtier}`);
		renderableContent.append(`<b>SubTier Text</b> ${tierInfo.subtierText}`);
	}
	sageMessage.send(renderableContent);
}
function registerTiers(): void {
	registerCommandRegex(/^pfs\s*tier\s+(\d+-\d+)\s+(\d+)(?:\s+|\s*,\s*)(\d+)(?:\s+|\s*,\s*)(\d+)(?:\s+|\s*,\s*)(\d+)((?:\s+|\s*,\s*)\d+)?((?:\s+|\s*,\s*)\d+)?((?:\s+|\s*,\s*)\d+)?\s*$/i, pfsTier);
	registerCommandHelp("PFS", "Tiers", `pfs tier {minLevel}-{maxLevel} {pc1Level} {pc2Level} {pc3Level} {pc4Level} {pc5Level} {pc6Level}`);
}
// #endregion Tier Calculator

// #region Scenario/Quest Randomizer/Scaler
export type TScenarioCallback = (sageMessage: SageMessage, tierInfo: TTierInfo) => RenderableContent;
export type TScenario = { id: string; tier: string; callback: TScenarioCallback; }
const scenarios: TScenario[] = [];
export function addScenario(scenarioId: string, tier: string, callback: TScenarioCallback): void {
	scenarios.push({ id: scenarioId, tier: tier, callback: callback });
}

function pfsScenario(sageMessage: SageMessage): void {
	const scenarioOrQuestId = sageMessage.args.shift();
	const pcLevelStrings = sageMessage.args;
	//this: Discord.Message, tierString: string, ...pcLevelStrings: string[]
	try {
		const scenarioOrQuestIdUpper = scenarioOrQuestId && scenarioOrQuestId.toUpperCase() || null,
			scenario = scenarios.find(_scenario => _scenario.id === scenarioOrQuestIdUpper);
		if (!scenario) {
			const renderableContent = createPfsRenderableContent(sageMessage);
			renderableContent.setTitle(`<b>PFS Scenario/Quest ${scenarioOrQuestId}</b>`);
			renderableContent.append(`Not yet loaded.`);
			sageMessage.send(renderableContent);
			return;
		}
		const tierInfo = calculateTierInfo(scenario.tier, cleanPcLevels(pcLevelStrings));
		if (tierInfo.invalidLevel) {
			const renderableContent = createPfsRenderableContent(sageMessage);
			renderableContent.setTitle(`<b>PFS Scenario/Quest ${scenarioOrQuestId}</b>`);
			renderableContent.append(`One or more PC has an invalid level.`);
			sageMessage.send(renderableContent);
			return;
		}
		sageMessage.send(scenario.callback(sageMessage, tierInfo));
	} catch (ex) {
		error("pfsScenario", ex);
	}
}
function registerScenarios(): void {
	registerCommandRegex(/^\s*pfs\s*((?:s\d+\-\d+)|(?:q\d+))\s+(\d+)(?:\s+|\s*,\s*)(\d+)(?:\s+|\s*,\s*)(\d+)(?:\s+|\s*,\s*)(\d+)((?:\s+|\s*,\s*)\d+)?((?:\s+|\s*,\s*)\d+)?((?:\s+|\s*,\s*)\d+)?\s*$/i, pfsScenario);
	registerCommandHelp("PFS", "Scenarios", `pfs s1-01 {pc1Level}, {pc2Level}, {pc3Level}, {pc4Level}, {pc5Level}, {pc6Level}`);
}
// #endregion Scenario/Quest Randomizer

export default function register(): void {
	registerDowntime();
	registerTiers();
	registerScenarios();
}
