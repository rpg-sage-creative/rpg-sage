export type ChatOptions = {
	/** specifies if the attachment should be included or not */
	doAttachment: boolean;
	/** is this message the first of a batch from multiline input? */
	isFirst: boolean;
	/** is this message the last of a batch from multiline input? */
	isLast: boolean;
};