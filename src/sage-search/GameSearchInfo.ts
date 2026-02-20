import type { GameSystemType } from "@rsc-sage/data-layer";
import { SearchInfo, type TSearchFlag } from "@rsc-utils/core-utils";

export class GameSearchInfo extends SearchInfo {
	public constructor(protected gameType: GameSystemType, searchText: string, flags: TSearchFlag = "") {
		super(searchText, flags);
	}
}