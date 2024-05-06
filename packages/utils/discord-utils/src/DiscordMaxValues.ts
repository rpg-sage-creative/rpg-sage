
export const DiscordMaxValues = {
	/** slash commands, message commands, user commands */
	command: {
		/** required */
		nameLength: 32,
		/** required for CHAT_INPUT; empty string ("") for USER and MESSAGE */
		descriptionLength: 100,
		option: {
			count: 25,
			/** required */
			nameLength: 32,
			/** required */
			descriptionLength: 100,
			choice: {
				count: 25,
				/** required */
				nameLength: 100,
				/** required */
				valueLength: 100
			}
		},
		totalLength: 8000,

		slashCount: 100,
		messageCount: 5,
		userCount: 5
	},

	/** message components */
	component: {
		button: {
			idLength: 100,
			labelLength: 80
		},
		row: {
			count: 5,
			buttonCount: 5,
			selectCount: 1
		},
		select: {
			idLength: 100,
			optionCount: 25,
			placeholderLength: 150
		}
	},

	/** message embeds */
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

	/** message */
	message: {
		contentLength: 2000,
		embedCount: 10,
		// fileCount: 10,
		// reactionCount: 20
	},

	/** user */
	usernameLength: 80
};

// files
// limited by size limit based on tier, not count

// channel
// tag limit of 20
// name length of 100
// topic 1024 (4096 forum)
// maxed pin messages 50
