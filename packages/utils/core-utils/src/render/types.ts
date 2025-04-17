import type { RenderableContent } from "./RenderableContent.js";

export interface Renderable {
	toRenderableContent(): RenderableContent;
}

export type RenderableContentResolvable = string | Renderable | RenderableContent;

export type RenderableContentSection = {
	content: string[];
	index: number;
	title?: string;
	columns: RenderableContentSectionColumn[];
};

export type RenderableContentSectionColumn = {
	title: string;
	content: string;
};
