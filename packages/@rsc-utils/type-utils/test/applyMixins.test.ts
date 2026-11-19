import { afterEach, describe, expect, test, vi } from "vitest";
import { applyMixins } from "../build/index.js";

describe("applyMixins", () => {

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test(`mixin methods are applied to the constructor prototype`, () => {
		class Base { base() { return "base"; } }
		const Mixin = class { aMethod(){ return "a"; } };
		applyMixins(Base, [Mixin], { exitOnConflict:false });
		const instance = new Base() as Base & { aMethod():string };
		expect(instance.aMethod()).toBe("a");
		expect(instance.base()).toBe("base");
	});

	test(`getter descriptors are copied intact`, () => {
		class Base {}
		const Mixin = class { get computed(){ return 42; } };
		applyMixins(Base, [Mixin], { exitOnConflict:false });
		expect((new Base() as Base & { computed:number }).computed).toBe(42);
	});

	test(`mixin constructors are ignored — never copied over`, () => {
		class Base {}
		const Mixin = class { constructor() { throw new Error("must never run"); } };
		applyMixins(Base, [Mixin], { exitOnConflict:false });
		expect(() => new Base()).not.toThrow();
	});

	test(`multiple mixins all apply`, () => {
		class Base {}
		const M1 = class { one(){ return 1; } };
		const M2 = class { two(){ return 2; } };
		applyMixins(Base, [M1, M2], { exitOnConflict:false });
		const instance = new Base() as Base & { one():number; two():number };
		expect(instance.one()).toBe(1);
		expect(instance.two()).toBe(2);
	});

	describe("conflicts with the constructor's own methods", () => {
		test(`default resolutionMethod "mixin" keeps the ctor method and logs an error`, () => {
			const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			class Base { shared(){ return "ctor"; } }
			const Mixin = class { shared(){ return "mixin"; } };
			applyMixins(Base, [Mixin], { exitOnConflict:false });
			expect(new Base().shared()).toBe("ctor");
			expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Mixin Conflict: Overriding Base.shared with Mixin.shared"));
		});

		test(`resolutionMethod "none" keeps the ctor method and logs an error`, () => {
			const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			class Base { shared(){ return "ctor"; } }
			const Mixin = class { shared(){ return "mixin"; } };
			applyMixins(Base, [Mixin], { exitOnConflict:false, resolutionMethod:"none" });
			expect(new Base().shared()).toBe("ctor");
			expect(errorSpy).toHaveBeenCalledTimes(1);
		});

		// QUIRK: "all" overrides the ctor method WITHOUT logging a conflict — only "mixin"/"none" report.
		test(`resolutionMethod "all" silently overrides the ctor method`, () => {
			const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			class Base { shared(){ return "ctor"; } }
			const Mixin = class { shared(){ return "mixin"; } };
			applyMixins(Base, [Mixin], { exitOnConflict:false, resolutionMethod:"all" });
			expect(new Base().shared()).toBe("mixin");
			expect(errorSpy).not.toHaveBeenCalled();
		});

		// QUIRK: a later mixin overriding an EARLIER mixin's property is not a conflict at all — it applies silently.
		test(`second mixin silently overrides the first mixin's same-named method`, () => {
			const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			class Base {}
			const M1 = class { shared(){ return "m1"; } };
			const M2 = class { shared(){ return "m2"; } };
			applyMixins(Base, [M1, M2], { exitOnConflict:false });
			expect((new Base() as Base & { shared():string }).shared()).toBe("m2");
			expect(errorSpy).not.toHaveBeenCalled();
		});
	});

	describe("exitOnConflict", () => {
		test(`default true: a conflict calls process.exit(1)`, () => {
			const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
			const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
			class Base { shared(){ return "ctor"; } }
			const Mixin = class { shared(){ return "mixin"; } };
			applyMixins(Base, [Mixin]);
			expect(exitSpy).toHaveBeenCalledWith(1);
			expect(errorSpy).toHaveBeenCalledTimes(1);
		});

		test(`default true: no conflict means no exit`, () => {
			const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
			const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
			class Base { base(){ return 1; } }
			const Mixin = class { added(){ return 2; } };
			applyMixins(Base, [Mixin]);
			expect(exitSpy).not.toHaveBeenCalled();
		});

		test(`false: a conflict logs but does not exit`, () => {
			const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
			const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
			class Base { shared(){ return "ctor"; } }
			const Mixin = class { shared(){ return "mixin"; } };
			applyMixins(Base, [Mixin], { exitOnConflict:false });
			expect(exitSpy).not.toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe("logPropertyMap", () => {
		test(`true logs the property map even without conflicts`, () => {
			const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
			class Base { base(){ return 1; } }
			const Mixin = class { added(){ return 2; } };
			applyMixins(Base, [Mixin], { exitOnConflict:false, logPropertyMap:true });
			expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining("added: Mixin"));
		});

		test(`"conflict" (default) stays silent when there is no conflict`, () => {
			const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
			class Base {}
			const Mixin = class { added(){ return 2; } };
			applyMixins(Base, [Mixin], { exitOnConflict:false });
			expect(debugSpy).not.toHaveBeenCalled();
		});

		test(`false stays silent even when a conflict occurs`, () => {
			const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
			class Base { shared(){ return "ctor"; } }
			const Mixin = class { shared(){ return "mixin"; } };
			applyMixins(Base, [Mixin], { exitOnConflict:false, logPropertyMap:false });
			expect(errorSpy).toHaveBeenCalledTimes(1); // conflict still reported...
			expect(debugSpy).not.toHaveBeenCalled(); // ...but the map is not logged
		});

		test(`applied properties are attributed to the mixin in the map`, () => {
			const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
			class Base {}
			const Mixin = class { added(){ return 2; } };
			applyMixins(Base, [Mixin], { exitOnConflict:false, logPropertyMap:true });
			expect(debugSpy).toHaveBeenCalledWith("debug:: added: Mixin");
		});

		test(`resolutionMethod "all" over an existing ctor member logs the Base -> Mixin chain`, () => {
			const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
			class Base { shared(){ return "ctor"; } }
			const Mixin = class { shared(){ return "mixin"; } };
			applyMixins(Base, [Mixin], { exitOnConflict:false, resolutionMethod:"all", logPropertyMap:true });
			expect(debugSpy).toHaveBeenCalledWith("debug:: shared: Base -> Mixin");
		});

		test(`class names are truncated at the first dot`, () => {
			const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
			const Dotted = class {};
			Object.defineProperty(Dotted, "name", { value:"Outer.Inner" });
			(Dotted.prototype as unknown as { shared:() => number }).shared = () => 1;
			class Base {}
			applyMixins(Base, [Dotted], { exitOnConflict:false, logPropertyMap:true });
			expect(debugSpy).toHaveBeenCalledWith("debug:: shared: Outer");
		});

		test(`anonymous mixins are logged with an empty name`, () => {
			const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
			const Anonymous = (() => class { added(){ return 1; } })();
			class Base {}
			applyMixins(Base, [Anonymous], { exitOnConflict:false, logPropertyMap:true });
			// the empty stack entry joins to an empty owner name
			expect(debugSpy).toHaveBeenCalledWith("debug:: added: ");
		});
	});

});
