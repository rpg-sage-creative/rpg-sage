
export const DiscordMaxValues = {
	embed: {
		titleLength: 256,
		descriptionLength: 4096,
		field: {
			count: 25,
			nameLength: 256,
			valueLength: 1024
		},
		footerTextLength: 2048,
		authorNameLength: 256,
		totalLength: 6000
	},
	message: {
		contentLength: 2000,
		embedCount: 10,
		// fileCount: 10,
		// reactionCount: 20
	},
	usernameLength: 80
};

// files
// limited by size limit based on tier, not count

// channel
// tag limit of 20
// name length of 100
// topic 1024 (4096 forum)
// maxed pin messages 50
