import { StringSet, type IncrementArg, type KeyValuePair } from "@rsc-utils/core-utils";
import { Condition } from "../../../../gameSystems/Condition.js";
import type { GameCharacter } from "../GameCharacter.js";
import { doStatMath } from "@rsc-utils/dice-utils";

export type ProcessPair = Omit<KeyValuePair<string|number, undefined>, "value"> & { operator?:"+"|"-"; value:string|number; };

export async function processCharStatsAndMods(char: GameCharacter, stats?: KeyValuePair<string, undefined|null>[], mods?:IncrementArg[]): Promise<StringSet> {
	const keysModdedAndUpdated = new StringSet();

	const updateStats = async (pairs: KeyValuePair<string, undefined|null>[]) => {
		const keysUpdated = await char.updateStats(pairs.map(pair => ({ key:pair.key, value:pair.value??null })), false);
		keysUpdated.forEach(key => keysModdedAndUpdated.add(key));
	};

	if (stats?.length) {
		// get game specific conditions and unset all when conditions=""
		const gameSystem = char.gameSystem;
		if (Condition.hasConditions(gameSystem)) {
			const conditions = stats?.find(stat => stat.key.toLowerCase() === "conditions");
			if (conditions?.value === null) {
				await updateStats(Condition.getToggledConditions(gameSystem).map(key => ({ key, value:undefined })));
				await updateStats(Condition.getValuedConditions(gameSystem).map(key => ({ key, value:undefined })));
			}
		}

		// basic stats processing
		await updateStats(stats);
	}

	if (mods?.length) {
		const curr = char.getCurrency();
		let currModded = false;

		const processPair = async (pair: ProcessPair | IncrementArg, pipes?: boolean) => {
			const oldValue = char.getString(pair.key) ?? 0;
			const pipedValue = pipes ? `||${pair.value}||` : pair.value;
			const math = `(${oldValue}${pair.operator}${pipedValue})`;
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
			const isSubtraction = pair.operator === "-";

			// get initial delta
			// const { hasPipes, unpiped } = unpipe(pair.value);
			// const delta = numberOrUndefined(unpiped);
			const hasPipes = false;
			const delta = pair.value ?? undefined;
			// skip pair if we don't have a value
			if (!delta) continue;

			// if denomination, handle it separately
			if (curr.hasDenomination(keyLower)) {
				curr.math(pair.operator, delta, keyLower);
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
					await processPair({ key:tmpKey!, operator:"-", value:tmpHpDelta }, tmpPipes || hasPipes);
				}

				// process the remaining delta against hp
				if (hpDelta) {
					await processPair({ key:hpKeyLower, operator:"-", value:hpDelta }, hasPipes);
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
					await processPair({ key:tmpHpKeyLower, operator:"-", value:tmpHpDelta, }, tmpPipes || hasPipes);
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
						await processPair({ key:staminaKeyLower, operator:"-", value:staminaDelta }, staminaPipes || hasPipes);
					}
				}

				// process the remaining delta against hp
				if (valueDelta) {
					await processPair({ key:hpKeyLower, operator:"-", value:valueDelta }, hasPipes);
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
					await processPair({ key:staminaKeyLower, operator:"-", value:staminaDelta, }, staminaPipes || hasPipes);
				}

				// process the remaining delta against hp
				if (valueDelta) {
					await processPair({ key:hpKeyLower, operator:"-", value:valueDelta }, hasPipes);
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