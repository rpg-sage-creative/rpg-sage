import { type Optional } from "@rsc-utils/core-utils";
import ExifReader from "exifreader";

type ImageType = "gif" | "jpeg" | "png" | "webp";

export type ImageMetadata = {
	height: number;
	size: number;
	type: ImageType;
	width: number;
};

export function bufferToMetadata(buffer: Optional<Buffer>): ImageMetadata | undefined {
	const size = buffer?.length ?? 0;
	if (!size) return undefined;

	const tags = ExifReader.load(buffer!);
	if (!tags) return undefined;

	const type = tags["FileType"]?.value as ImageType;
	const width = tags["Image Width"]?.value ?? tags["ImageWidth"]?.value;
	const height = tags["Image Height"]?.value ?? tags["ImageHeight"]?.value;

	if (!type || !width || !height) return undefined;


	return { type, width, height, size };
}