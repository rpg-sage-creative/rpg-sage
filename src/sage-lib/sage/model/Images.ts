import { Optional } from "../../../sage-utils";

export type ImageData<Tags extends string = string> = {
	tags: Tags[];
	url: string;
};

export type CoreWithImages<
		Tags extends string = string,
		Image extends ImageData<Tags> = ImageData<Tags>
		> = {

	/** Array containing the images; may not exist. */
	images?: Image[];
};

export interface HasCoreWithImages<
		Tags extends string = string,
		Image extends ImageData<Tags> = ImageData<Tags>
		> {

	/** The collection of images. */
	images: Images<Tags, Image>;
}

/** Returns true if the two arrays are the same (non-zero) length and have the same values. */
function areTagsIdentical(tagsA: string[], tagsB: string[]): boolean {
	// no lengths saves us time
	if (!tagsA.length || !tagsB.length) {
		return false;
	}

	const setA = new Set(tagsA);
	const setB = new Set(tagsB);

	// different sizes save us time
	if (setA.size !== setB.size) {
		return false;
	}

	// look for a missing tag
	for (const tag of setA) {
		if (!setB.has(tag)) {
			return false;
		}
	}

	return true;
}

export class Images<
		Tags extends string,
		Image extends ImageData<Tags> = ImageData<Tags>
		> {

	public constructor(private images: Image[]) { }

	/** The number of images. */
	public get size(): number { return this.images.length; }

	/** Returns the first (and hopefully only) image that contains exactly the given tags. */
	public get(...tags: Tags[]): Image | undefined {
		return this.images.find(image => areTagsIdentical(tags, image.tags));
	}

	/**
	 * Returns the first (and hopefully only) image's url that contains exactly the given tags.
	 * Convenience for .get(...tags)?.url
	 */
	public getUrl(...tags: Tags[]): string | undefined {
		return this.get(...tags)?.url;
	}

	/**
	 * Updates image's url that matches exactly the tags given.
	 * If no image exists with the given tags, one is created.
	 */
	public setUrl(url: Optional<string>, ...tags: Tags[]): Image | undefined {
		const set = new Set(tags);
		let image = this.get(...set);
		if (!image && url) {
			image = { url, tags } as Image;
			this.images.push(image);
		}else if (image && !url) {
			this.images.splice(this.images.indexOf(image), 1);
		}
		return image;
	}

	public toArray(mapper?: (image: ImageData) => ImageData): ImageData[] {
		if (mapper) {
			return this.images.map(mapper);
		}
		return this.images.map(({ tags, url }) => ({ tags: tags.slice(), url }));
	}
}