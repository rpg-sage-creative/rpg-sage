type Options = {
	/** use ^ and $ to anchor the url to the start/end of the string */
	anchored?: boolean;
	/** use <> to allow escaped urls for discord */
	escaped?: boolean;
};

function getProtocolRegex(): RegExp {
	return /https?:\/\//i;
}

function getDomainRegex(): RegExp {
	return /(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z]{2,}/i;
}

function getIp4Regex(): RegExp {
	return /(?:\d{1,3}\.){3}\d{1,3}/;
}

function getHostRegex(): RegExp {
	const sources = [
		getDomainRegex().source,
		getIp4Regex().source,
		"localhost"
	];
	return new RegExp(`(?:${sources.join("|")})`, "i");
}

function getPathRegex(): RegExp {
	return /(?:\/[-a-z\d%_.~+]*)*/i;
}

function getQuerystringRegex(): RegExp {
	return /(?:\?[;&a-z\d%_.~+=-]*)?/i;
}

function getAnchorRegex(): RegExp {
	return /(?:\#[-a-z\d_]*)?/i;
}

export function createUrlRegex(): RegExp;
export function createUrlRegex(options: Options): RegExp;
export function createUrlRegex(options?: Options): RegExp {
	const sources = [
		getProtocolRegex().source,
		getHostRegex().source,
		getPathRegex().source,
		getQuerystringRegex().source,
		getAnchorRegex().source
	];
	if (options?.escaped) {
		sources.unshift("<");
		sources.push(">");
	}
	if (options?.anchored) {
		sources.unshift("^");
		sources.push("$");
	}
	return new RegExp(sources.join(""), "i");
}
