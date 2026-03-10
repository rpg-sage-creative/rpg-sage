import type { GameSystemCode } from "@rsc-sage/data-layer";
import { SearchInfo, type TSearchFlag } from "@rsc-utils/core-utils";

export class GameSearchInfo<Code extends GameSystemCode> extends SearchInfo {
	public constructor(public gameSystem: Code, searchText: string, flags: TSearchFlag = "") {
		super(searchText, flags);
	}
}