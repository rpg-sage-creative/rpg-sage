import type { Wealth } from "./Wealth.js";

type WealthWithoutSummary = Omit<Wealth, "summary"> & { summary?:string; };

export function summarizeWealth(wealth: WealthWithoutSummary, summaryTemplate?: string | null): Wealth {
	const denominations = ["credits", "pp", "gp", "ep", "sp", "cp", "upbs"] as (keyof Wealth)[];
	if (summaryTemplate) {
		wealth.summary = summaryTemplate;
		denominations.forEach(denom => wealth.summary?.replace(new RegExp(`{${denom}}`, "ig"), String(wealth[denom] ?? "0")));
	}else {
		const values = denominations.filter(d => wealth[d]).map(denom => `${wealth[denom]} ${denom}`);
		if (wealth.valuables) {
			values.push(...wealth.valuables);
		}
		if (!values.length) {
			values.push(`*empty pockets*`);
		}
		wealth.summary = `**${wealth.name}:** ${values.join(", ")}`;
	}
	return wealth as Wealth;
}
