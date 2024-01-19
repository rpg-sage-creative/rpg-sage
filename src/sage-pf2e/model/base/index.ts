import { registerObject } from "../../data/Repository";
import { Source } from "./Source";

export function registerBaseObjects(): void {
	registerObject(Source);
}