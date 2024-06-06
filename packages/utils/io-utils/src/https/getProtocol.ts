import followRedirects from "follow-redirects";

/** Returns http if the url starts with http://, or https otherwise. */
export function getProtocol(url: string): typeof followRedirects.http | typeof followRedirects.https {
	return (/^http:\/\//i).test(url) ? followRedirects.http : followRedirects.https;
}
