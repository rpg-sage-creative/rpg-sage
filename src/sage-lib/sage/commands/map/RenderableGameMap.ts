import { errorReturnNull } from "../../../../sage-utils/utils/ConsoleUtils/Catchers";
import type { IMap, IMapLayer, THasOffset, TMapBackgroundImage, TMapLayerImage } from "../../../../sage-utils/utils/MapUtils/types";
import { mapToBuffer } from "../../../../sage-utils/utils/MapUtils";
import type { TGameMapAura, TGameMapCore, TGameMapImage } from "./GameMapBase";

class RenderableGameMapLayer implements IMapLayer {
	public constructor(protected images: TGameMapImage[]) { }

	public getImages<T extends TMapLayerImage>(): T[] {
		return this.images.map(image => {
			return {
				size: image.size,
				gridOffset: image.pos,
				opacity: (image as TGameMapAura).opacity,
				url: image.url
			} as T;
		});
	}

	public getOffset(): Partial<THasOffset> {
		return { };
	}
}

export default class RenderableGameMap implements IMap {
	public constructor (protected core: TGameMapCore) { }

	public getBackground(): TMapBackgroundImage {
		return {
			url: this.core.url
		};
	}

	public getGrid(): [number, number] {
		return this.core.grid;
	}

	public getLayers(): RenderableGameMapLayer[] {
		const auras = this.core.auras.slice();
		this.core.tokens.forEach(token => auras.push(...token.auras.filter(aura => aura.id === token.auraId)));
		return [
			new RenderableGameMapLayer(this.core.terrain),
			new RenderableGameMapLayer(auras),
			new RenderableGameMapLayer(this.core.tokens)
		];
	}

	public render(): Promise<Buffer | null> {
		return mapToBuffer(this).catch(errorReturnNull);
	}
}