/** Matches a discord emoji, animated or not. */
export const DiscordEmojiRegExp = /<a?:\w{2,}:\d{16,}>/i;

/** Matches an animated discord emoji only. */
export const AnimatedDiscordEmojiRegExp = /<a:\w{2,}:\d{16,}>/i;

/** Matches a non-animated discord emoji only. */
export const NonAnimatedDiscordEmojiRegExp = /<:\w{2,}:\d{16,}>/i;
