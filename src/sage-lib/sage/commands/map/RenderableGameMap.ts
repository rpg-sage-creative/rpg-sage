import { RenderableMap } from "../../../../sage-utils/utils/MapUtils";
import type { IMapLayer, MapRenderResponse, THasOffset, TMap, TMapBackgroundImage, TMapLayer, TMapLayerImage } from "../../../../sage-utils/utils/MapUtils";
import type { TGameMapAura, TGameMapCore, TGameMapImage } from "./GameMapBase";
import { TParsedGameMapCore } from "./gameMapImporter";

class RenderableGameMapLayer implements IMapLayer {
	public constructor(protected images: TGameMapImage[]) { }

	public getImages<T extends TMapLayerImage>(): T[] {
		return this.images.map(image => {
			return {
				gridOffset: image.pos,
				opacity: (image as TGameMapAura).opacity,
				scale: image.scale,
				size: image.size,
				url: image.url
			} as T;
		});
	}

	public getOffset(): Partial<THasOffset> {
		return { };
	}

	public toJSON(): TMapLayer {
		return {
			images: this.getImages(),
			offset: this.getOffset()
		};
	}
}

RenderableMap.setEndpoint({port:3000});
export default class RenderableGameMap extends RenderableMap {
	public constructor (protected core: TGameMapCore) {
		super();
	}

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

	public toJSON(): TMap {
		return {
			background: this.getBackground(),
			grid: this.getGrid(),
			layers: this.getLayers().map(layer => layer.toJSON())
		};
	}

	public static testRender(gameData: TGameMapCore | TParsedGameMapCore): Promise<MapRenderResponse> {
		const map = new RenderableGameMap(gameData as TGameMapCore);
		return RenderableMap._testRender(map.toJSON());
	}
}