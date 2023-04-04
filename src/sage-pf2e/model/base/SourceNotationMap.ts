import { toSuperscript } from "../../../sage-utils/NumberUtils";
import type { RenderableContent } from "../../../sage-utils/RenderUtils";
import type { UUID } from "../../../sage-utils/UuidUtils";
import type { HasSource } from "./HasSource";
import { Source } from "./Source";


export class SourceNotationMap<T extends HasSource> {
	private sources: Source[];

	public constructor(items: T[] = [], public includeCore = false) {
		this.sources = [Source.Core];
		this.addByHasSource(items);
	}

	public appendNotatedItems(content: RenderableContent, items: T[]): void {
		if (this.isEmpty) {
			content.append(items.map(item => item.toSearchResult()).join(", "));
		} else {
			content.append(`${this.formatNames(items).join(", ")}\n\n${this.formatSourceNames().join("\n")}`);
		}
	}
	public addByHasSource(items: T[]): void {
		items.filter(SourceNotationMap.filterByHasSource).forEach(item => {
			if (!this.sources.includes(item.source)) {
				this.sources.push(item.source);
			}
		});
	}
	public formatNames(items: T[]): string[];
	public formatNames(items: T[], delimiter: string): string;
	public formatNames(items: T[], delimiter?: string): string | string[] {
		const mapped = items.map(item => `${item.toSearchResult()}${this.getByHasSource(item)}`);
		return delimiter ? mapped.join(delimiter) : mapped;
	}
	public formatSourceNames(): string[];
	public formatSourceNames(delimiter: string): string;
	public formatSourceNames(delimiter?: string): string | string[] {
		const mapped = this.sources
			.map((source, index) => `${toSuperscript(index)}${source.toVerboseString().replace(/Pathfinder Adventure Path/g, "AP")}`)
			.slice(this.includeCore ? 0 : 1);
		return delimiter ? mapped.join(delimiter) : mapped;
	}
	public get(sourceId?: UUID): string {
		const sourceIndex = this.sources.findIndex(source => source.id === sourceId);
		const includeCore = this.includeCore ? 0 : 1;
		return sourceIndex < includeCore ? "" : toSuperscript(sourceIndex);
	}
	public getBySource(source?: Source): string {
		return this.get(source?.id);
	}
	public getByHasSource(hasSource?: T): string {
		return this.getBySource(hasSource?.source);
	}
	public get isEmpty(): boolean {
		return this.size === 0;
	}
	public get size(): number {
		return this.sources.length - (this.includeCore ? 0 : 1);
	}

	public static appendNotatedItems<T extends HasSource>(content: RenderableContent, items: T[]): void {
		new SourceNotationMap(items).appendNotatedItems(content, items);
	}
	public static filterByHasSource<T extends HasSource>(item: T): boolean {
		if (!item.source) {
			console.warn(`Missing Source: ${item.objectType} (${item.id})`);
		}
		return !!item.source;
	}
}
