
/**
 * An abstract class that allows an "instanceof" comparison of classes that may have been loaded from different contexts.
 * For example, two npm libs have your class in their node_modules folder.
 * This class should only be used if you are having this problem and trying to work around until you have debugged the problem.
 * NOTE: For SuperClass.instanceOf to work correctly, ensure that classes relying on it have unique names.
 */
export abstract class SuperClass {

	/** Causes all SuperClass descendents to have a default toString() result of '[object ClassName]' */
	public get [Symbol.toStringTag]() {
		return (this.constructor as typeof SuperClass).toStringTag;
	}

	/** This allows children to override the toStringTag without needing to override the instance get and the static instanceOf */
	protected static get toStringTag(): string {
		return this.name;
	}

	/** This implementation of instanceof allows for the chance that the same class may be loaded twice in different contexts. */
	public static instanceOf<T extends SuperClass>(value: any): value is T;
	public static instanceOf<T extends typeof SuperClass>(value: any, klass: T): value is InstanceType<T>;
	public static instanceOf<T extends typeof SuperClass>(value: any, klass?: T): value is InstanceType<T> {
		// attempt a proper instanceof
		klass = klass ?? this as T;
		if (value instanceof klass) {
			return true;
		}

		// walk the chain just in case
		if (value && "instanceOf" in klass) {
			let proto = value.__proto__;
			do {
				if (klass.toStringTag === proto[Symbol.toStringTag]) {
					return true;
				}
			}while (proto = proto.__proto__);
		}

		return false;
	}

}
