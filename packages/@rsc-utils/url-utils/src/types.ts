/** A valid URL starts with http:// or https:// */
export type VALID_URL = string & { valid_url:never; };

/** A wrapped URL has characters around it, usually <>. These are generally for telling chat apps (Discord) to not load a preview. */
export type WRAPPED_URL = string & { wrapped_url:never; };

/** A URL can be escaped or not. */
export type URL = string | VALID_URL | WRAPPED_URL;

export type WrapOptions = {
	/** expects the two characters used to wrap the url, ex: <> for discord */
	wrapChars?: string;

	/** determines if the .wrapped value is optional or not */
	wrapOptional?: boolean;
};