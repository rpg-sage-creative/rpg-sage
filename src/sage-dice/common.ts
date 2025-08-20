import { HasIdCore, type IdCore } from "@rsc-utils/core-utils";
import type { DiceOutputType, GameSystemType } from "@rsc-utils/game-utils";


//#region Interfaces/Types

export type TDiceOutput = {
	hasSecret: boolean;
	inlineOutput: string;
	input: string,
	output: string;
};

export interface DieCore<T extends string = string> extends IdCore<T> {
	gameType: GameSystemType;
}
export abstract class HasDieCore<T extends DieCore<U>, U extends string = string> extends HasIdCore<T, U> {
	public get gameType(): GameSystemType { return this.core.gameType; }
}

export interface IDiceBase<T extends IRollBase = IRollBase<any>> extends HasDieCore<DieCore> {
	hasSecret: boolean;
	roll(): T;
}

export interface IRollBase<T extends IDiceBase = IDiceBase<any>, U = any> extends HasDieCore<DieCore> {
	hasSecret: boolean;
	dice: T;
	rolls: U[];
	toString(outputType?: DiceOutputType): string;
}

//#endregion
