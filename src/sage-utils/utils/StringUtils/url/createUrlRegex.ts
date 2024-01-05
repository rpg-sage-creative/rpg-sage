import { RegExpCreateOptions } from "../regex/RegExpCreateOptions.js";

type Options = Omit<RegExpCreateOptions, "quantifier"> & {
	/** use ^ and $ to anchor the url to the start/end of the string */
	anchored?: boolean;

	/** expects the two characters used to wrap the url, ex: <> for discord */
	wrapped?: string;
};

function getProtocolRegex(): RegExp {
	return /(?:s?ftp|https?):\/\//i;
}

function getDomainRegex(): RegExp {
	return /(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z]{2,}/i;
}

function getIp4Regex(): RegExp {
	return /(?:\d{1,3}\.){3}\d{1,3}/;
}

function getHostnameRegex(): RegExp {
	const sources = [
		getDomainRegex().source,
		getIp4Regex().source,
		"localhost"
	];
	const regex = sources.join("|");
	return new RegExp(`(?:${regex})`, "i");
}

function getPortRegex(): RegExp {
	return /(?::\d{1,5})?/;
}

function getPathRegex(): RegExp {
	return /(?:\/[-a-z\d%_.~+]*)*/i;
}

function getQuerystringRegex(): RegExp {
	return /(?:\?[;&a-z\d%_.~+=-]*)?/i;
}

function getAnchorRegex(): RegExp {
	return /(?:#[-a-z\d_]*)?/i;
}

export function createUrlRegex(): RegExp;
export function createUrlRegex(options: Options): RegExp;
export function createUrlRegex(options?: Options): RegExp {
	const capture = options?.capture;
	const flags = options?.globalFlag ? "gi" : "i";

	const sources = [
		getProtocolRegex().source,
		getHostnameRegex().source,
		getPortRegex().source,
		getPathRegex().source,
		getQuerystringRegex().source,
		getAnchorRegex().source
	];
	if (options?.wrapped?.length === 2) {
		const [left, right] = options.wrapped.split("");
		sources.unshift(left);
		sources.push(right);
	}
	if (options?.anchored) {
		sources.unshift("^");
		sources.push("$");
	}
	const regex = sources.join("");

	if (capture) {
		if (capture === true) {
			return new RegExp(`(${regex})`, flags);
		}
		return new RegExp(`(?<${capture}>${regex})`, flags);
	}
	return new RegExp(sources.join(""), flags);
}
