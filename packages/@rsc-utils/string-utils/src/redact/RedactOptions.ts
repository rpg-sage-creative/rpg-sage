export type RedactOptions = {
	/** What character to use for redacted characters. */
	char?: string;
	/** Redact punctuation? */
	complete?: boolean;
	/** What character to use for redacted punctuation characters when complete === true. */
	punctuationChar?: string;
};