import type { RenderableContent as UtilsRenderableContent } from "@rsc-utils/render-utils";
import { RenderableContent } from "../data/RenderableContent";
import { find } from "../data/Repository";
import type { SourcedCore } from "./base/HasSource";
import { HasSource } from "./base/HasSource";


// #region Core Interface
export interface TableCore extends SourcedCore<"Table"> {
	number: string;
	bodies?: string[][][];
	rows?: string[][];
	footer: string[];
}
// #endregion

function mapTr(row: string[], rowIndex: number): string {
	const tdOrTh = rowIndex ? "td" : "th";
	const cells = row.map(cell => `<${tdOrTh}>${cell}</${tdOrTh}>`).join("");
	return `<tr>${cells}</tr>`;
}
function mapTable(rows: string[][]): string {
	return `<table>${rows.map(mapTr).join("")}</table>`;
}

export class Table extends HasSource<TableCore> {
	public get footer(): string[] { return this.core.footer || []; }
	public get header(): string { return `Table ${this.number}: ${this.name}`; }
	public get number(): string { return this.core.number; }
	public get bodies(): string[][][] { return this.core.bodies || [this.core.rows || []]; }
	public get rows(): string[][] { return this.bodies.reduce((all, body) => all.concat(body), []); }

	public toRenderableContent(): UtilsRenderableContent {
		const renderable = new RenderableContent(this);
		renderable.setTitle(this.header.bold());
		this.bodies.forEach(body => renderable.appendSection(mapTable(body)));
		if (this.footer.length) {
			renderable.append(...this.footer.map(s => `<blockquote>${s}</blockquote>`));
		}
		return renderable;
	}

	public static findByNumber(number: string, source?: string): Table | undefined {
		return find("Table", source, table => table.number === number);
	}

}
