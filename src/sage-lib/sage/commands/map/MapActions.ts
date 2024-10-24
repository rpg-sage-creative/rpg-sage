const MapActions = {
	MapUpLeft: "↖️",
	MapUp: "⬆️",
	MapUpRight: "↗️",
	MapTerrain: "⛰️",
	MapRaise: "🔼",
	MapLeft: "⬅️",
	MapConfig: "⚙️",
	MapRight: "➡️",
	MapAura: "🟡",
	MapDelete: "❌",
	MapDownLeft: "↙️",
	MapDown: "⬇️",
	MapDownRight: "↘️",
	MapToken: "👤",
	MapLower: "🔽",
};

export type MapAction = keyof typeof MapActions;

export function isMapAction(action: string): action is MapAction {
	return action in MapActions;
}

export function getMapActionEmoji(action: MapAction): string {
	return MapActions[action];
}