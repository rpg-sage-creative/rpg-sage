import type { GameSystemType } from "@rsc-sage/types";
import { SearchInfo, type TSearchFlag } from "@rsc-utils/search-utils";

export class GameSearchInfo extends SearchInfo {
	public constructor(public gameType: GameSystemType, searchText: string, flags: TSearchFlag = "") {
		super(searchText, flags);
	}
}