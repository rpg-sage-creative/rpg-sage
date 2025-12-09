import type { Wealth } from "./Wealth.js";
import { summarizeWealth } from "./summarizeWealth.js";

type WealthWithoutSummary = Omit<Wealth, "summary"> & { summary?:string; };

export function appendWealth(total: WealthWithoutSummary, mod: WealthWithoutSummary, summaryTemplate?: string | null): Wealth {
	total.credits += mod.credits;
	total.upbs += mod.upbs;
	total.pp += mod.pp;
	total.gp += mod.gp;
	total.sp += mod.sp;
	total.cp += mod.cp;
	total.valuables.push(...mod.valuables);
	return summarizeWealth(total, summaryTemplate);
}