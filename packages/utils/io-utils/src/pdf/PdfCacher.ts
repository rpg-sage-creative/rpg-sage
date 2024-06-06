import { getDataRoot } from "@rsc-utils/core-utils";
import { randomUUID, type UUID } from "crypto";
import PDFParser from "pdf2json";
import { deleteFileSync } from "../fs/deleteFileSync.js";
import { writeFile } from "../fs/writeFile.js";
import { getBuffer } from "../https/getBuffer.js";
import type { Optional } from "./internal/types.js";

/** Copies a pdf from the given url to a local file before trying to read it. */
export class PdfCacher {

	/** The local file id. */
	private id: UUID;

	/** The path to the local file. */
	private cachedPdfPath: string;

	/** Creates a new PdfCacher for the given url. */
	public constructor(private url: string) {
		this.id = randomUUID();
		this.cachedPdfPath = `${getDataRoot("cache/pdf", true)}/${this.id}.pdf`;
	}

	/** Reads from the url and writes the local file. */
	private async setCache(): Promise<boolean> {
		const buffer = await getBuffer(this.url).catch(() => null);
		if (buffer) {
			return writeFile(this.cachedPdfPath, buffer, true).catch(() => false);
		}
		return false;
	}

	/** Reads the local file and returns the JSON returned by PDFParser. */
	public async read<T>(): Promise<T> {
		const cached = await this.setCache();
		if (!cached) {
			return Promise.reject(new Error(`No Cache to read: ${this.id}`));
		}

		return new Promise((resolve, reject) => {
			const pdfParser = new PDFParser();

			pdfParser.on("pdfParser_dataError", async (errData: any) => {
				this.removeCache();
				reject(errData.parserError);
			});

			pdfParser.on("pdfParser_dataReady", async (json: any) => {
				this.removeCache();
				resolve(json);
			});

			pdfParser.loadPDF(this.cachedPdfPath);
		});

	}

	/** Deletes the local file. */
	private removeCache(): boolean {
		return deleteFileSync(this.cachedPdfPath);
	}

	/** Convenience for new PdfCacher(url).read(); */
	public static async read<U>(url: Optional<string>): Promise<U | null> {
		if (url) {
			return new PdfCacher(url).read();
		}
		return null;
	}

}