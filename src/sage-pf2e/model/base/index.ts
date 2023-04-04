import { registerObject } from "../../data";
import { Source } from "./Source";

export * from "./AonBase";
export * from "./Base";
export * from "./HasSource";
export * from "./interfaces";
export * from "./Pf2tBase";
export * from "./Source";
export * from "./SourceNotationMap";

export function register(): void {
	registerObject(Source);
}