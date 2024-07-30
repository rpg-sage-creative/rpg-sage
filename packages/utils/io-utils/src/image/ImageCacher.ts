import { getDataRoot, randomSnowflake, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { deleteFileSync } from "../fs/deleteFileSync.js";
import { readFile } from "../fs/readFile.js";
import { writeFile } from "../fs/writeFile.js";
import { getBuffer } from "../https/getBuffer.js";
import { bufferToMetadata, type ImageMetadata } from "./bufferToMetadata.js";

/** Copies an image from the given url to a local file before trying to read it. */
export class ImageCacher {

	/** The local file id. */
	private id: Snowflake;

	/** The path to the local file. */
	private cachedImagePath: string;

	/** Creates a new ImageCacher for the given url. */
	public constructor(private url: string) {
		this.id = randomSnowflake();
		this.cachedImagePath = `${getDataRoot("cache/image", true)}/${this.id}.img`;
	}

	/** Reads from the url and writes the local file. */
	private async setCache(): Promise<boolean> {
		const buffer = await getBuffer(this.url).catch(() => null);
		if (buffer) {
			return writeFile(this.cachedImagePath, buffer, true).catch(() => false);
		}
		return false;
	}

	/** Reads the local file and returns the image metadata. */
	public async read(): Promise<Buffer> {
		const cached = await this.setCache();
		if (!cached) {
			return Promise.reject(new Error(`No Cache to read: ${this.id}`));
		}

		return new Promise((resolve, reject) => {
			readFile(this.cachedImagePath).then(buffer => {
				this.removeCache();
				resolve(buffer);
			}, err => {
				this.removeCache();
				reject(err);
			});
		});

	}

	/** Deletes the local file. */
	private removeCache(): boolean {
		return deleteFileSync(this.cachedImagePath);
	}

	/** Convenience for new PdfCacher(url).read(); */
	public static async read(url: Optional<string>): Promise<Buffer | undefined> {
		if (url) {
			const cacher = new ImageCacher(url);
			return cacher.read();
		}
		return undefined;
	}

	public static async readMetadata(url: Optional<string>): Promise<ImageMetadata | undefined> {
		const buffer = await ImageCacher.read(url);
		return bufferToMetadata(buffer);
	}

}