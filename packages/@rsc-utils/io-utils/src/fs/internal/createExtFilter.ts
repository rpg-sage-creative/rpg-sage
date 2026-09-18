type ExtensionFilter = (fileName: string) => boolean;

/** @internal */
export function createExtFilter(ext: string): ExtensionFilter {
	const regex = new RegExp(`\\.${ext}$`, "i");
	return (fileName: string) => regex.test(fileName);
}