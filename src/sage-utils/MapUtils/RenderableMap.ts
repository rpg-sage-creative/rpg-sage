import { errorReturnNull } from "../ConsoleUtils";
import { iMapToBuffer } from "./iMapToBuffer";
import type { IMap, IMapLayer, TMap, TMapBackgroundImage, TOrPromiseT } from "./types";


/**
 * A template for creating maps that can be rendered through this library.
 */
export abstract class RenderableMap implements IMap {
	abstract getBackground(): TOrPromiseT<TMapBackgroundImage>;
	abstract getGrid(): TOrPromiseT<[number, number]>;
	abstract getLayers(): TOrPromiseT<IMapLayer[]>;
	public render(): Promise<Buffer | null> {
		return iMapToBuffer(this).catch(errorReturnNull);
	}
	abstract toJSON(): TOrPromiseT<TMap>;
}
