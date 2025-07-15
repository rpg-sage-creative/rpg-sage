
export type ArrowDirection = "upleft" | "up" | "upright" | "left" | "right" | "downleft" | "down" | "downright";
export type CompassDirection = "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se";
export type Direction = ArrowDirection | CompassDirection | MoveDirection | OrdinalDirection;
export type OrdinalDirection = "ul" | "u" | "ur" | "l" | "r" | "dl" | "d" | "dr";

export enum MoveDirectionOutputType {
	Compact = 0,
	Verbose = 1
}

type DirectionBase = {
	arrow: ArrowDirection;
	compass: CompassDirection;
	/** north south east west etc */
	compassLabel: string;
	ordinal: OrdinalDirection;
	/** up down left right etc */
	ordinalLabel: string;
};
function getAllDirections(): DirectionBase[] {
	return [
		{ arrow:"upleft", compass:"nw", compassLabel:"northwest", ordinal:"ul", ordinalLabel:"up and left" },
		{ arrow:"up", compass:"n", compassLabel:"north", ordinal:"u", ordinalLabel:"up" },
		{ arrow:"upright", compass:"ne", compassLabel:"northeast", ordinal:"ur", ordinalLabel:"up and right" },
		{ arrow:"left", compass:"w", compassLabel:"west", ordinal:"l", ordinalLabel:"left" },
		{ arrow:"right", compass:"e", compassLabel:"east", ordinal:"r", ordinalLabel:"right" },
		{ arrow:"downleft", compass:"sw", compassLabel:"southwest", ordinal:"dl", ordinalLabel:"down and left" },
		{ arrow:"down", compass:"s", compassLabel:"south", ordinal:"d", ordinalLabel:"down" },
		{ arrow:"downright", compass:"se", compassLabel:"southeast", ordinal:"dr", ordinalLabel:"down and right" },
	];
}

type FindDirectionArg = ArrowDirection | CompassDirection | OrdinalDirection;
function findBase(dir: FindDirectionArg): DirectionBase {
	dir = dir.toLowerCase() as FindDirectionArg;
	return getAllDirections().find(base => base.arrow === dir || base.compass === dir || base.ordinal === dir)!;
}

/**
 * We always need a new regex when using "global" to avoid lastIndex issues of back-to-back identical strings.
 * Finding ordinals in dialog is breaking emoji formatting, so we need to be able to restrict what we capture.
 */
function getCompassDirectionsRegex(type: "both" | "compass" | "ordinal") {
	// all compass regex needs to have this order to capture nw/ne/sw/se before capturing n/s: nw|ne|n|sw|se|s|w|e
	// all ordinal regex needs to have this order to capture ul/ur/dl/dr before capturing u/d: ul|ur|u|dl|dr|d|l|r
	switch(type) {
		case "compass":
			return /\[\s*(?:\b(?:\s|\d+(?:nw|ne|n|sw|se|s|w|e)|(?:nw|ne|n|sw|se|s|w|e)\d*)\b)+\s*\]/gi;
		case "ordinal":
			return /\[\s*(?:\b(?:\s|\d+(?:ul|ur|u|dl|dr|d|l|r)|(?:ul|ur|u|dl|dr|d|l|r)\d*)\b)+\s*\]/gi;
		default:
			return /\[\s*(?:\b(?:\s|\d+(?:nw|ne|n|sw|se|s|w|e|ul|ur|u|dl|dr|d|l|r)|(?:nw|ne|n|sw|se|s|w|e|ul|ur|u|dl|dr|d|l|r)\d*)\b)+\s*\]/gi;
	}
}

let distanceDirectionRegex: RegExp;
let directionDistanceRegex: RegExp;

/**
 * @param match expected to be regex.exec(string)[0] or string.replace(regexp, match => {}).
 */
function parseDirectionPairs(match: string): MoveDirection[] {
	distanceDirectionRegex ??= /(?<distance>\d+)(?<direction>nw|ne|n|sw|se|s|w|e|ul|ur|u|dl|dr|d|l|r)/i;
	directionDistanceRegex ??= /(?<direction>nw|ne|n|sw|se|s|w|e|ul|ur|u|dl|dr|d|l|r)(?<distance>\d+)?/i;

	// pairs array should be something like: ["s", "2n", "w3"]
	const pairs = match.slice(1, -1).split(/\s/).filter(s => s);
	return pairs.map(pair => {
		// test with required number prefix before testing witth optional number suffix
		const match = distanceDirectionRegex.exec(pair)
			?? directionDistanceRegex.exec(pair);

		const groups = match?.groups as { direction:CompassDirection|OrdinalDirection; distance?:`${number}`; };

		// direction is there, distance is optional
		const { direction } = groups;
		const distance = +(groups.distance ?? 1);

		return new MoveDirection(direction, distance);
	});
}

export class MoveDirection {

	private base: DirectionBase;
	public distance: number;

	public constructor(direction: Direction, distance?: number) {
		if (typeof(direction) === "string") {
			this.base = findBase(direction);
			this.distance = distance ?? 1;
		}else {
			this.base = direction.base;
			this.distance = distance ?? direction.distance;
		}
	}

	public get arrow() { return this.base.arrow; }
	public get arrowEmoji(): string {
		return `:${this.arrow}:`;
	}
	public get compass() { return this.base.compass; }
	public get compassEmoji(): string {
		return `[${this.compass}]`;
	}
	public get compassLabel() { return this.base.compassLabel; }
	public get distanceEmoji(): string {
		/** @todo add number emoji to Sage */
		return this.distance === 1 ? "" : String(this.distance).split("").map(s => MoveDirection.NumberEmoji[+s]).join("");
	}
	public get ordinal() { return this.base.ordinal; }
	public get ordinalLabel() { return this.base.ordinalLabel; }

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

		const matches = content.match(getCompassDirectionsRegex("both"));

		// matches array should be something like: [ '[ S S E ]', '[2N]', '[W3]' ]
		matches?.forEach(match => directions.push(...parseDirectionPairs(match)));

		return MoveDirection.compact(directions);
	}

	/**
	 * Finds compass direction blocks in dialog and converts it to text that can be formatted by Sage to emoji.
	 * @param content content (usually dialog) with the compass direction blocks
	 * @param style defaults to Compact
	 */
	public static replaceAll(content: string, style?: MoveDirectionOutputType): string {
		return content.replace(getCompassDirectionsRegex("compass"), match => {
			return MoveDirection.toEmoji(parseDirectionPairs(match), style);
		});
	}

	/** Combines adjacent directions and increments counts */
	public static compact(directions: Direction[]): MoveDirection[] {
		const compacted: MoveDirection[] = [];
		directions.forEach(dir => {
			const last = compacted[compacted.length - 1];
			const isString = typeof(dir) === "string";
			const arrow = isString ? findBase(dir).arrow : dir.arrow;
			if (last?.arrow === arrow) {
				last.distance += isString ? 1 : dir.distance;
			}else {
				compacted.push(new MoveDirection(dir));
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
