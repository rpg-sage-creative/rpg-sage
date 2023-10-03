import type * as coreHttp from "http";
import type * as coreHttps from "https";
import * as _followRedirects from "follow-redirects";
import type { Override, RedirectScheme } from "follow-redirects";
const { http, https } = (_followRedirects as any).default as typeof _followRedirects;

export type thttp = Override<
	typeof coreHttp,
	RedirectScheme<coreHttp.RequestOptions, coreHttp.ClientRequest, coreHttp.IncomingMessage>
>;
export type thttps = Override<
	typeof coreHttps,
	RedirectScheme<coreHttps.RequestOptions, coreHttp.ClientRequest, coreHttp.IncomingMessage>
>;

/** Returns http if the url starts with http://, or https otherwise. */
export function getProtocol(url: string): thttp | thttps {
	return url.match(/^http:\/\//i) ? http : https;
}
