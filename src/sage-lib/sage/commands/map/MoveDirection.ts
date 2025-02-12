
export type CompassDirection = "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se";
export type ArrowDirection = "upleft" | "up" | "upright" | "left" | "right" | "downleft" | "down" | "downright";

export type Direction = CompassDirection | ArrowDirection | MoveDirection;

export enum MoveDirectionOutputType {
	Compact = 0,
	Verbose = 1
}

/** Converts compass directions to arrow directions, retains given arrow diretions. */
function ensureCompassDirection(dir: CompassDirection | ArrowDirection): CompassDirection {
	switch(dir) {
		case "upleft": return "nw";
		case "up": return "n";
		case "upright": return "ne";
		case "left": return "w";
		case "right": return "e";
		case "downleft": return "sw";
		case "down": return "s";
		case "downright": return "se";
		default: return dir;
	}
}

/** Converts compass directions to arrow directions, retains given arrow diretions. */
function ensureArrowDirection(dir: CompassDirection | ArrowDirection): ArrowDirection {
	switch(dir) {
		case "nw": return "upleft";
		case "n": return "up";
		case "ne": return "upright";
		case "w": return "left";
		case "e": return "right";
		case "sw": return "downleft";
		case "s": return "down";
		case "se": return "downright";
		default: return dir;
	}
}

/** get text for human readable direction */
function toOrdinalDirection(arrow: ArrowDirection): string {
	switch(arrow) {
		case "upleft": return "up and left";
		case "up": return "up";
		case "upright": return "up and right";
		case "left": return "left";
		case "right": return "right";
		case "downleft": return "down and left";
		case "down": return "down";
		case "downright": return "down and right";
		default: return "";
	}
}

/** We always need a new regex when using "global" to avoid lastIndex issues of back-to-back identical strings. */
function getCompassDirectionsRegex() {
	// all compass regex needs to have this order to capture nw/ne/sw/se before capturing n/s: nw|ne|n|sw|se|s|w|e
	return /\[\s*(?:\b(?:\s|\d+(?:nw|ne|n|sw|se|s|w|e)|(?:nw|ne|n|sw|se|s|w|e)\d*)\b)+\s*\]/gi;
}

/**
 * @param match expected to be regex.exec(string)[0] or string.replace(regexp, match => {}).
 */
function parseCompassPairs(match: string): MoveDirection[] {
	// pairs array should be something like: ["s", "2n", "w3"]
	const pairs = match.slice(1, -1).split(/\s/).filter(s => s);
	return pairs.map(pair => {
		// test with required number prefix before testing witth optional number suffix
		const match = /(?<count>\d+)(?<compass>nw|ne|n|sw|se|s|w|e)/i.exec(pair)
			?? /(?<compass>nw|ne|n|sw|se|s|w|e)(?<count>\d+)?/i.exec(pair);

		const groups = match?.groups as { compass:CompassDirection; count?:`${number}`; };

		// direction is there, distance is optional
		const { compass } = groups;
		const count = +(groups.count ?? 1);

		return new MoveDirection(compass, count);
	});
}

export class MoveDirection {

	public arrow: ArrowDirection;
	public compass: CompassDirection;
	public distance: number;

	public constructor(direction: Direction, distance?: number) {
		if (typeof(direction) === "string") {
			this.arrow = ensureArrowDirection(direction);
			this.compass = ensureCompassDirection(direction);
			this.distance = distance ?? 1;
		}else {
			this.arrow = direction.arrow;
			this.compass = direction.compass;
			this.distance = distance ?? direction.distance;
		}
	}

	public get arrowEmoji(): string {
		return `:${this.arrow}:`;
	}
	public get compassEmoji(): string {
		return `[${this.compass}]`;
	}
	public get distanceEmoji(): string {
		/** @todo add number emoji to Sage */
		return this.distance === 1 ? "" : String(this.distance).split("").map(s => MoveDirection.NumberEmoji[+s]).join("");
	}
	public get ordinalText(): string {
		return toOrdinalDirection(this.arrow);
	}

	/**
	 * @param outputType defaults to Compact
	 * @returns text that can be formatted by Sage to emoji.
	 */
	public toEmoji(outputType?: MoveDirectionOutputType): string {
		if (outputType === MoveDirectionOutputType.Verbose) {
			return new Array(this.distance).fill(this.compassEmoji).join(" ");
		}
		return this.distanceEmoji + this.compassEmoji;
	}

	/** Collects all compass direction blocks into a single set of compact MoveDirection objects. */
	public static collect(content: string): MoveDirection[] {
		const directions: MoveDirection[] = [];

		const matches = content.match(getCompassDirectionsRegex());

		// matches array should be something like: [ '[ S S E ]', '[2N]', '[W3]' ]
		matches?.forEach(match => directions.push(...parseCompassPairs(match)));

		return MoveDirection.compact(directions);
	}

	/**
	 * Finds compass direction blocks in dialog and converts it to text that can be formatted by Sage to emoji.
	 * @param content content (usually dialog) with the compass direction blocks
	 * @param style defaults to Compact
	 */
	public static replaceAll(content: string, style?: MoveDirectionOutputType): string {
		return content.replace(getCompassDirectionsRegex(), match => {
			return MoveDirection.toEmoji(parseCompassPairs(match), style);
		});
	}

	/** Combines adjacent directions and increments counts */
	public static compact(directions: Direction[]): MoveDirection[] {
		const compacted: MoveDirection[] = [];
		directions.forEach(dir => {
			const last = compacted[compacted.length - 1];
			const isString = typeof(dir) === "string";
			const arrow = isString ? ensureArrowDirection(dir) : dir.arrow;
			if (last?.arrow === arrow) {
				last.distance += isString ? 1 : dir.distance;
			}else {
				compacted.push(MoveDirection.from(dir));
			}
		});
		return compacted;
	}

	/**
	 * Creates a new MoveDirection instance, can be used in [].map()
	 * @param direction a value that can be converted to a MoveDirection
	 * @param distance overrides the distance of a MoveDirection only if given; defaults to 1
	 * @returns
	 */
	public static from(direction: Direction, distance?: number): MoveDirection {
		return new MoveDirection(direction, arguments.length < 3 ? distance : undefined);
	}

	/** Convenience method for calling toEmoji on directions that ensures consistent spacing. */
	public static toEmoji(directions: Direction[], style?: MoveDirectionOutputType): string {
		return MoveDirection.compact(directions).map(dir => dir.toEmoji(style)).join(" ");
	}

	/** @todo add number emoji to Sage */
	public static readonly NumberEmoji = [":zero:", ":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:"];
}
