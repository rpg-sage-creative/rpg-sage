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

export class Images<
		Tags extends string,
		Image extends ImageData<Tags> = ImageData<Tags>
		> {

	public constructor(private images: Image[]) { }

	/** The number of images. */
	public get size(): number { return this.images.length; }

	/** Returns the image that contains all of the given tags. */
	public get(...tags: Tags[]): Image | undefined {
		return this.images.find(image => !tags.map(tag => image.tags.includes(tag)).includes(false));
	}

	/** Returns the url of the image that contains all of the given tags. Convenience for .get(...tags)?.url */
	public getUrl(...tags: Tags[]): string | undefined {
		return this.get(...tags)?.url;
	}

	public toArray(mapper?: (image: ImageData) => ImageData): ImageData[] {
		if (mapper) {
			return this.images.map(mapper);
		}
		return this.images.map(({ tags, url }) => ({ tags: tags.slice(), url }));
	}
}