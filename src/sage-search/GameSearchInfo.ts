import type { GameType } from "../sage-common";
import type { TSearchFlag } from "../sage-utils/SearchUtils";
import { SearchInfo } from "../sage-utils/SearchUtils";

/** A subclass of SearchInfo that includes a GameType */
export class GameSearchInfo extends SearchInfo {
	public constructor(public gameType: GameType, searchText: string, flags: TSearchFlag = "") {
		super(searchText, flags);
	}
}