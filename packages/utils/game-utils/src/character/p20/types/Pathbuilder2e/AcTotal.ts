type ShieldBonus = { shieldBonus: number; }
				 | { shieldBonus: "number" | "null"; };

export type AcTotal = {
	acProfBonus: number;
	acAbilityBonus: number;
	acItemBonus: number;
	acTotal: number;
	// shieldBonus: number | null;
} & ShieldBonus;