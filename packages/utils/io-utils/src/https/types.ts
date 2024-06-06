
/** An escaped URL has <> characters around it. These are generally for telling chat apps (Discord) to not load a preview. */
export type ESCAPED_URL = string & { escaped_url:never; };

/** A valid URL starts with http:// or https:// */
export type VALID_URL = string & { valid_url:never; };

/** A URL can be escaped or not. */
export type URL = string | ESCAPED_URL | VALID_URL;

export type AppServerEndpoint = {
	secure: boolean;
	hostname: string;
	port: number;
};

export type BufferHandlerJsonError = {
	error: string;
};

export type BufferHandlerResponse<T> = {
	statusCode: number;
	contentType: string;
	body: T;
};

export type BufferHandler<T> = (buffer: Buffer) => Promise<BufferHandlerResponse<T | BufferHandlerJsonError>>;
