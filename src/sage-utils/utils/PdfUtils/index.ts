import { getBuffer } from "@rsc-utils/https-utils";
import * as _PDFParser from "pdf2json";
import { deleteFileSync, writeFile } from "../FsUtils";
import { generate } from "../UuidUtils";
const PDFParser: typeof _PDFParser = _PDFParser.default;

export class PdfCacher {

	private uuid = generate();

	public constructor(private url: string) { }

	private get cachedPdfPath(): string {
		return `./${this.uuid}.pdf`;
	}

	private async setCache(): Promise<boolean> {
		const buffer = await getBuffer(this.url).catch(() => null);
		if (buffer) {
			return writeFile(this.cachedPdfPath, buffer).catch(() => false);
		}
		return false;
	}

	public async read<T>(): Promise<T> {
		const cached = await this.setCache();
		if (!cached) {
			return Promise.reject();
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

	private removeCache(): boolean {
		return deleteFileSync(this.cachedPdfPath);
	}

	public static read<U>(url: string): Promise<U> {
		return new PdfCacher(url).read();
	}

}