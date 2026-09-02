import { registerObject } from "../../data/Repository.js";
import { Source } from "./Source.js";

export function registerBaseObjects(): void {
	registerObject(Source);
}