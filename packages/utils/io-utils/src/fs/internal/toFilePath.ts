/**
 * @internal
 * Removes the filename from the end of the given path.
 */
export function toFilePath(filePathAndName: string): string {
	return filePathAndName.split(/\//).slice(0, -1).join("/");
}
