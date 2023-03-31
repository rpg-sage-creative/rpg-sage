import type { Override, RedirectScheme } from "follow-redirects";
import * as followRedirects from "follow-redirects";
import type * as coreHttp from "http";
import type * as coreHttps from "https";

export type thttp = Override<
    typeof coreHttp,
    RedirectScheme<coreHttp.RequestOptions, coreHttp.ClientRequest, coreHttp.IncomingMessage>
>;
export type thttps = Override<
    typeof coreHttps,
    RedirectScheme<coreHttps.RequestOptions, coreHttp.ClientRequest, coreHttp.IncomingMessage>
>;

export function getProtocol(url: string): thttp | thttps {
	return url.match(/^http:\/\//i) ? followRedirects.http : followRedirects.https;
}
