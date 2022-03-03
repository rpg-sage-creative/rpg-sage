import ClassCache from "./ClassCache";

/**
 * NOTE: For SuperClass.instanceOf to work correctly, ensure that classes relying on it have unique names.
 */
export default abstract class SuperClass {

    /** Provides a caching mechanism for all SuperClass classes. */
    private _cache: ClassCache | undefined;
    protected get cache(): ClassCache {
        return this._cache ?? (this._cache = new ClassCache());
    }

    /** Causes all HasCore descendents to have a default toString() result of '[object ClassName]' */
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
