import type { RenderableContent } from ".";

export interface IRenderable {
	toRenderableContent(): RenderableContent;
}

export type TRenderableContentSection = {
	content: string[];
	index: number;
	title: string | null;
	columns: TRenderableContentSectionColumn[];
};

export type TRenderableContentSectionColumn = {
	title: string;
	content: string;
};
