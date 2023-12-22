type Constructor = new (...args: any[]) => {};

function getName(ctor: Constructor): string {
	return ctor.name.split(".")[0];
}

type ConflictResolutionMethod = "all" | "mixin" | "none";

type MixinOptions = {
	/** use process.exit(1) if a conflict is found */
	exitOnConflict?: boolean;
	/** how to handle conflicts */
	resolutionMethod?: ConflictResolutionMethod;
};

export function applyMixins(ctor: Constructor, mixins: any[], options: MixinOptions = {}): void {
	const { exitOnConflict = true, resolutionMethod = "mixin" } = options;

	let conflicts = false;
	const propertyMap = new Map<string, string[]>();
	const initialPropertyNames = Object.getOwnPropertyNames(ctor.prototype);
	initialPropertyNames.forEach(name => propertyMap.set(name, [getName(ctor)]));
	mixins.forEach(mixin => {
		Object.getOwnPropertyNames(mixin.prototype).forEach(name => {
			// ignore constructors
			if (name === "constructor") {
				return;
			}

			// apply them by default
			let apply = false;

			// check for conflict of composite
			if (Object.hasOwn(ctor.prototype, name)) {
				if (resolutionMethod === "none" || (resolutionMethod === "mixin" && initialPropertyNames.includes(name))) {
					console.error(`error:: Mixin Conflict: Overriding ${getName(ctor)}.${name} with ${getName(mixin)}.${name}`);
					conflicts = true;

				}else {
					apply = true;
				}
			}else {
				apply = true;
			}

			// apply the property if we still want it
			if (apply) {
				Object.defineProperty(
					mixin.prototype,
					name,
					Object.getOwnPropertyDescriptor(mixin.prototype, name) ?? Object.create(null)
				);
				propertyMap.set(name, (propertyMap.get(name) ?? []).concat([getName(mixin)]));
			}
		});
	});

	if (conflicts) {
		// log the updated property map just in case
		[...propertyMap].forEach(([key, stack]) => console.debug(`${key}: ${stack.join(" -> ")}`));

		// if we have conflicts and are exiting because of them
		if (exitOnConflict) {
			process.exit(1);
		}
	}
}
