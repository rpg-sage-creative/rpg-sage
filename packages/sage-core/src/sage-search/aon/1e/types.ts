import type { GameSystemCode } from "@rsc-sage/data-layer";

export type Aon1eGameSystemCode = GameSystemCode & ("PF1e" | "SF1e");

export type Aon1eSearchResultsLink = {
	cat: string;
	label: string;
	url: string;
	partial: boolean;
	exact: boolean;
	objectType: "Aon1eSearchResultsLink";
};

export type Aon1eSearchResultsCat = {
	label: string;
	links: Aon1eSearchResultsLink[];
	unique: Aon1eSearchResultsLink[];
	exact: boolean;
	objectType: "Aon1eSearchResultsCategory";
};