import { error, warn, type RenderableContent } from "@rsc-utils/core-utils";
import { ColorType } from "../../model/HasColorsCore.js";
import type { SageMessage } from "../../model/SageMessage.js";
import { registerCommandRegex } from "../cmd.js";
import { createRenderableContent } from "../helpers/createRenderableContent.js";

export type TPfsFaction = "Horizon Hunters" | "Vigilant Seal" | "Envoys' Alliance" | "Grand Archive";

export function createPfsRenderableContent(sageMessage: SageMessage): RenderableContent {
	return createRenderableContent(sageMessage.getHasColors(), ColorType.PfsCommand);
}

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
	const args = sageMessage.args.manager.valueArgs().map(arg => arg.value) as string[];
	const tierString = args.shift()!;
	const pcLevelStrings = args;
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
}
// #endregion Tier Calculator

// #region Scenario/Quest Randomizer/Scaler
export type TScenarioCallback = (sageMessage: SageMessage, tierInfo: TTierInfo) => RenderableContent;
export type TScenario = { id: string; tier: string; callback: TScenarioCallback; };
const scenarios: TScenario[] = [];
export function addScenario(scenarioId: string, tier: string, callback: TScenarioCallback): void {
	scenarios.push({ id: scenarioId, tier: tier, callback: callback });
}

function pfsScenario(sageMessage: SageMessage): void {
	const args = sageMessage.args.manager.valueArgs().map(arg => arg.value) as string[];
	const scenarioOrQuestId = args.shift();
	const pcLevelStrings = args;
	//this: Discord.Message, tierString: string, ...pcLevelStrings: string[]
	try {
		const scenarioOrQuestIdUpper = scenarioOrQuestId?.toUpperCase() ?? null,
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
}
// #endregion Scenario/Quest Randomizer

export function registerPfs(): void {
	registerTiers();
	registerScenarios();
}
