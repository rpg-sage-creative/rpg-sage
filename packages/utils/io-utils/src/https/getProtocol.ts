import followRedirects from "follow-redirects";

const HttpUrlRegExp = /^http:\/\//i;

/** Returns http if the url starts with http://, or https otherwise. */
export function getProtocol(url: string): typeof followRedirects.http | typeof followRedirects.https {
	return HttpUrlRegExp.test(url) ? followRedirects.http : followRedirects.https;
}
