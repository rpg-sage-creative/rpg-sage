import { RenderableMap, type GameMapLayer, type MapRenderResponse, type HasOffset, type GameMapData, type GameMapBackgroundImage, type GameMapLayerData, type GameMapLayerImage } from "@rsc-utils/game-utils"
import type { TGameMapAura, TGameMapCore, TGameMapImage } from "./GameMapBase.js";
import type { TParsedGameMapCore } from "./gameMapImporter.js";

class RenderableGameMapLayer implements GameMapLayer {
	public constructor(protected images: TGameMapImage[]) { }

	public getImages<T extends GameMapLayerImage>(): T[] {
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

	public getOffset(): Partial<HasOffset> {
		return { };
	}

	public toJSON(): GameMapLayerData {
		return {
			images: this.getImages(),
			offset: this.getOffset()
		};
	}
}

export class RenderableGameMap extends RenderableMap {
	public constructor (protected core: TGameMapCore) {
		super();
	}

	public getBackground(): GameMapBackgroundImage {
		return {
			url: this.core.url
		};
	}

	public getGrid(): [number, number, string | undefined] {
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

	public toJSON(): GameMapData {
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
