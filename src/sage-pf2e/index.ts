import { loadData } from "./data";
import { register as registerObjects } from "./model";
import { register as registerBaseObjects } from "./model/base";
import { register as registerBestiaryObjects } from "./model/bestiary";

export * from "./common";
export * from "./map";
export * from "./model";
export * from "./weather";

export function registerAndLoad(pf2DataPath: string, includePf2ToolsData = false): Promise<void> {
	registerBaseObjects();
	registerBestiaryObjects();
	registerObjects();
	return loadData(pf2DataPath, includePf2ToolsData);
}