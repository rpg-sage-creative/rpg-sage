import type { GameSystemCode } from "../../system/GameSystem.js";
import type { CurrencyCore } from "../Currency.js";

type CoreArg<
	GameSystem extends GameSystemCode,
	Denominations extends string
> = Omit<CurrencyCore<GameSystem, Denominations>, "objectType">;

/**
 * @internal
 * Creates a new core from the given core while ensuring gameSystem, neg, and objectType.
 * Exported for use in testing.
 */
export function coreFrom<
	Core extends CurrencyCore<GameSystem, DenomKeys>,
	GameSystem extends GameSystemCode,
	DenomKeys extends string,
>(input?: Partial<CoreArg<GameSystem, DenomKeys>>, gameSystem?: GameSystem): Core {
	const output = { ...input as CoreArg<GameSystemCode, DenomKeys> } as CurrencyCore<GameSystemCode, DenomKeys>;
	if (!output.gameSystem) {
		output.gameSystem = gameSystem ?? "None";
	}
	if (output.neg !== true) {
		output.neg = false;
	}
	output.objectType = "Currency";
	return output as Core;
}