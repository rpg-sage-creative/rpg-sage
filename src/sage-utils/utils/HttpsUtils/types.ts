/** An escaped URL has <> characters around it. These are generally for telling chat apps (Discord) to not load a preview. */
export type ESCAPED_URL = string & { escaped_url:never; };
/** A valid URL starts with http:// or https:// */
export type VALID_URL = string & { valid_url:never; };
/** A URL can be escaped or not. */
export type URL = string | ESCAPED_URL | VALID_URL;
