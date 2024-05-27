/** @internal Parses the given string for html attribute key/value pairs. */
export function parseAttributes(attributesString: string): Map<string, string> {
	const attributes = new Map();

	if (!attributesString) {
		return attributes;
	}

	const attsRegex = /\w+="[^"]+"/gi;
	const matches = attsRegex.exec(attributesString);
	if (!matches) {
		return attributes;
	}

	matches.forEach(pair => {
		const pairRegex = /(\w+)="([^"]+)"/i;
		const match = pairRegex.exec(pair);
		if (match) {
			attributes.set(match[1], match[2]);
		}
	});

	return attributes;
}
