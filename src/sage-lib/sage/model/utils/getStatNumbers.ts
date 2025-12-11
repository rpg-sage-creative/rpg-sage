import { numberOrUndefined } from "@rsc-utils/core-utils";
import type { StatNumbersOptions, StatNumbersResults, StatsCharacter } from "@rsc-utils/game-utils";
import { getMetaStat } from "./getMetaStat.js";

type Options = StatNumbersOptions & {
	char: StatsCharacter;
	key: string;
};

/**
 * Gets the value and meta data for the meta keys as numbers.
 * For each meta key: .xKey, .x, .xDefined, and .xPipes are returned.
 * .hasPipes and .isEmpty are also included as tests against all meta keys.
 * If no meta keys are specified, then all meta keys are returned.
 */
export function getStatNumbers(opts: Options): StatNumbersResults {
	const allOpts = !opts || (opts.val && opts.min && opts.max && opts.tmp);

	const max = allOpts || opts?.max ? getMetaStat(opts.char, opts.key, "max") : undefined;
	const min = allOpts || opts?.min ? getMetaStat(opts.char, opts.key, "min") : undefined;
	const tmp = allOpts || opts?.tmp ? getMetaStat(opts.char, opts.key, "tmp") : undefined;
	const val = allOpts || opts?.val ? opts.char.getStat(opts.key, true) : undefined;

	return {
		hasPipes: val?.hasPipes || min?.hasPipes || max?.hasPipes || tmp?.hasPipes,
		isEmpty: !val?.isDefined && !min?.isDefined && !max?.isDefined && !tmp?.isDefined,

		val: val?.isDefined ? numberOrUndefined(val.hasPipes ? val.unpiped : val.value) : undefined,
		valDefined: val?.isDefined,
		valKey: val?.key,
		valPipes: val?.hasPipes,

		min: min?.isDefined ? numberOrUndefined(min.hasPipes ? min.unpiped : min.value) : undefined,
		minDefined: min?.isDefined,
		minKey: min?.key,
		minPipes: min?.hasPipes,

		max: max?.isDefined ? numberOrUndefined(max.hasPipes ? max.unpiped : max.value) : undefined,
		maxDefined: max?.isDefined,
		maxKey: max?.key,
		maxPipes: max?.hasPipes,

		tmp: tmp?.isDefined ? numberOrUndefined(tmp.hasPipes ? tmp.unpiped : tmp.value) : undefined,
		tmpDefined: tmp?.isDefined,
		tmpKey: tmp?.key,
		tmpPipes: tmp?.hasPipes,
	};
}