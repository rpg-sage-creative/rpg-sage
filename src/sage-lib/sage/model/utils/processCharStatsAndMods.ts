import { numberOrUndefined, StringSet } from "@rsc-utils/core-utils";
import type { StatModPair } from "../../commands/admin/GameCharacter/getCharacterArgs.js";
import type { TKeyValuePair } from "../SageMessageArgs.js";
import type { GameCharacter } from "../GameCharacter.js";
import { Condition } from "../../../../gameSystems/Condition.js";
import { doStatMath, unpipe } from "@rsc-utils/dice-utils";

export type ProcessPair = Omit<TKeyValuePair, "value"> & { modifier?:"+"|"-"; value:string|number; };

export async function processCharStatsAndMods(char: GameCharacter, stats?: TKeyValuePair[], mods?:StatModPair[]): Promise<StringSet> {
	const keysModdedAndUpdated = new StringSet();

	const updateStats = async (pairs: TKeyValuePair[]) => {
		const keysUpdated = await char.updateStats(pairs, false);
		keysUpdated.forEach(key => keysModdedAndUpdated.add(key));
	};

	if (stats?.length) {
		// get game specific conditions and unset all when conditions=""
		const gameSystem = char.gameSystem;
		if (Condition.hasConditions(gameSystem)) {
			const conditions = stats?.find(stat => stat.key.toLowerCase() === "conditions");
			if (conditions?.value === null) {
				await updateStats(Condition.getToggledConditions(gameSystem).map(key => ({ key, value:null })));
				await updateStats(Condition.getValuedConditions(gameSystem).map(key => ({ key, value:null })));
			}
		}

		// basic stats processing
		await updateStats(stats);
	}

	if (mods?.length) {
		const curr = char.getCurrency();
		let currModded = false;

		const processPair = async (pair: ProcessPair | StatModPair, pipes?: boolean) => {
			const oldValue = char.getString(pair.key) ?? 0;
			const pipedValue = pipes ? `||${pair.value}||` : pair.value;
			const math = `(${oldValue}${pair.modifier}${pipedValue})`;
			const newValue = doStatMath(math);
			await updateStats([{ key:pair.key, value:newValue }]);
		};

		const { valKey:hpKey, tmpKey:tmpHpKey } = char.getNumbers(char.getKey("hitPoints"), { val:true, tmp:true });
		const hpKeyLower = (hpKey ?? char.getKey("hitPoints")).toLowerCase();
		const tmpHpKeyLower = (tmpHpKey ?? hpKeyLower + ".tmp").toLowerCase();
		const staminaKeyLower = char.getKey("staminaPoints").toLowerCase();
		const isSF1e = char.gameSystem?.code === "SF1e";

		for (const pair of mods) {
			const keyLower = pair.key.toLowerCase();
			const isSubtraction = pair.modifier === "-";

			// get initial delta
			const { hasPipes, unpiped } = unpipe(pair.value);
			const delta = numberOrUndefined(unpiped);
			// skip pair if we don't have a value
			if (!delta) continue;

			// if denomination, handle it separately
			if (curr.hasDenomination(keyLower)) {
				curr.math(pair.modifier!, delta, keyLower);
				currModded = true;

			}

			// if subtracting hp, check to see if we need to also subtract from temphp
			else if (!isSF1e && isSubtraction && keyLower === hpKeyLower) {
				// copy initial hp delta
				let hpDelta = delta;

				// get temp hp
				const { tmpKey, tmp:tmpHp, tmpPipes } = char.getNumbers(hpKeyLower, { tmp:true });
				// calculate temp hp delta
				const tmpHpDelta = tmpHp ? Math.min(tmpHp, hpDelta) : 0;
				// subtract from hp delta and process temp hp
				if (tmpHpDelta) {
					hpDelta -= tmpHpDelta;
					await processPair({ key:tmpKey!, modifier:"-", value:tmpHpDelta }, tmpPipes || hasPipes);
				}

				// process the remaining delta against hp
				if (hpDelta) {
					await processPair({ key:hpKeyLower, modifier:"-", value:hpDelta }, hasPipes);
				}
			}

			// if tmpHp is reduced to <0, subtract from stamina; if stamina is reduced to <0, subtract from hp
			else if (isSF1e && isSubtraction && keyLower === tmpHpKeyLower) {
				// copy initial delta
				let valueDelta = delta;

				// get temp hp
				const { tmp:tmpHp, tmpPipes } = char.getNumbers(hpKeyLower, { tmp:true });
				// calc temp hp delta
				const tmpHpDelta = tmpHp ? Math.min(tmpHp, valueDelta) : 0;
				// sub from tmpHp
				if (tmpHpDelta) {
					valueDelta -= tmpHpDelta;
					await processPair({ key:tmpHpKeyLower, modifier:"-", value:tmpHpDelta, }, tmpPipes || hasPipes);
				}

				// process remaining delta against stamina
				if (valueDelta) {
					// get stamina
					const { val:stamina, valPipes:staminaPipes } = char.getNumbers(staminaKeyLower, { val:true });
					// calc stamina delta
					const staminaDelta = stamina ? Math.min(stamina, valueDelta) : 0;
					// sub from stamina
					if (staminaDelta) {
						valueDelta -= staminaDelta;
						await processPair({ key:staminaKeyLower, modifier:"-", value:staminaDelta }, staminaPipes || hasPipes);
					}
				}

				// process the remaining delta against hp
				if (valueDelta) {
					await processPair({ key:hpKeyLower, modifier:"-", value:valueDelta }, hasPipes);
				}

			}

			else if (isSF1e && isSubtraction && keyLower === staminaKeyLower) {
				// copy initial delta
				let valueDelta = delta;

				// get stamina
				const { val:stamina, valPipes:staminaPipes } = char.getNumbers(staminaKeyLower, { val:true });
				// calc stamina delta
				const staminaDelta = stamina ? Math.min(stamina, valueDelta) : 0;
				// sub from stamina
				if (staminaDelta) {
					valueDelta -= staminaDelta;
					await processPair({ key:staminaKeyLower, modifier:"-", value:staminaDelta, }, staminaPipes || hasPipes);
				}

				// process the remaining delta against hp
				if (valueDelta) {
					await processPair({ key:hpKeyLower, modifier:"-", value:valueDelta }, hasPipes);
				}
			}

			// finally do basic processing
			else {
				await processPair(pair);
			}
		}

		// if we modded the currency data, we still gotta update the stats themselves
		if (currModded) {
			await updateStats(curr.denominationKeys.map(denom => ({ key:denom, value:String(curr[denom]) })));
		}
	}

	return keysModdedAndUpdated;
}