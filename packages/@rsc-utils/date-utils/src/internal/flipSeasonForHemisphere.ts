import { Season } from "../Season.js";

/** @internal */
export function flipSeasonForHemisphere(season: Season): Season | undefined {
	switch (season) {
		case Season.Winter: return Season.Summer;
		case Season.Spring: return Season.Fall;
		case Season.Summer: return Season.Winter;
		case Season.Fall: return Season.Spring;
		case Season.Wet: return Season.Dry;
		case Season.Dry: return Season.Wet;
		default: return undefined;
	}
}
