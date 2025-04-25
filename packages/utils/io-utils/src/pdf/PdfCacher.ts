import { getDataRoot, randomSnowflake, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import PDFParser from "pdf2json";
import { deleteFile } from "../fs/deleteFile.js";
import { writeFile } from "../fs/writeFile.js";
import { getBuffer } from "../https/getBuffer.js";
import { PdfJsonManager } from "./PdfJsonManager.js";
import type { PdfJson } from "./types.js";

/** Copies a pdf from the given url to a local file before trying to read it. */
export class PdfCacher {

	/** The local file id. */
	private readonly id: Snowflake;

	/** The path to the local file. */
	private readonly cachedPdfPath: string;

	/** Creates a new PdfCacher for the given url. */
	public constructor(private readonly url: string) {
		this.id = randomSnowflake();
		this.cachedPdfPath = `${getDataRoot("cache/pdf", true)}/${this.id}.pdf`;
	}

	/** Reads from the url and writes the local file. */
	private async setCache(): Promise<boolean> {
		const buffer = await getBuffer(this.url).catch(() => undefined);
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

			//#region timeout logic

			// this timer is to avoid hanging a process
			let timer: NodeJS.Timeout;
			// how many seconds to wait
			const TIMER_MS = 2000;
			// reset counter keeps us from running too long
			let resetCount = 0;
			// (arbitrary number)
			const MAX_RESETS = 5;
			// clears the timer during cleanup
			const clearTimer = () => timer ? clearTimeout(timer) : void 0;
			// resets the counter during various events
			const resetTimer = () => {
				if (resetCount < MAX_RESETS) {
					clearTimer();
					// instead of having more resolve/reject logic, simply use the pdfParser's emit to pass along an error
					timer = setTimeout(() => pdfParser.emit("pdfParser_dataError", { parserError:"TIMEOUT" }), TIMER_MS);
				}
			};

			//#endregion

			pdfParser.once("pdfParser_dataError", async (errData: any) => {
				clearTimer();
				await this.removeCache();
				reject(errData?.parserError);
			});

			pdfParser.once("pdfParser_dataReady", async (json: any) => {
				clearTimer();
				await this.removeCache();
				resolve(json);
			});

			pdfParser.once("data", resetTimer);

			pdfParser.once("readable", _meta => {
				/** @todo logic here for testing headers? */
				resetTimer();
			});

			pdfParser.loadPDF(this.cachedPdfPath).then(resetTimer);

			resetTimer();
		});

	}

	/** Convenience for: PdfJsonManager.from(await this.read()) */
	public async createManager<T extends PdfJson>(): Promise<PdfJsonManager<T>> {
		return new Promise((resolve, reject) =>
			this.read<T>()
				.then(json => resolve(PdfJsonManager.from(json)), reject)
		);
	}

	/** Deletes the local file. */
	private async removeCache(): Promise<boolean> {
		return deleteFile(this.cachedPdfPath).catch(() => false);
	}

	/** Convenience for new PdfCacher(url).read(); */
	public static async read<U>(url: Optional<string>): Promise<U | undefined> {
		if (url) {
			const cacher = new PdfCacher(url);
			return cacher.read();
		}
		return undefined;
	}

	/** Convenience for: PdfJsonManager.from(await this.read()) */
	public static async createManager<U extends PdfJson>(url: Optional<string>): Promise<PdfJsonManager<U> | undefined> {
		return new Promise((resolve, reject) =>
			PdfCacher.read<U>(url)
				.then(json => resolve(PdfJsonManager.from(json)), reject)
		);
	}

}