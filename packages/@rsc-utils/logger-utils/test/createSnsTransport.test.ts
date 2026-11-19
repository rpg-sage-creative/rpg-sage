import { describe, expect, test } from "vitest";
import type { SnsClientConfig } from "@rsc-utils/aws-utils";
// createSnsTransport is a default export — `export *` in index.ts does not re-export defaults, so it must be imported directly
import createSnsTransport from "../build/createSnsTransport.js";

const validClientConfig = {
	accessKeyId:"AKIDEXAMPLE",
	region:"us-east-1",
	secretAccessKey:"secret",
	topicArn:"arn:aws:sns:us-east-1:000000000000:rpg-sage"
} as SnsClientConfig;

// NOTE: constructing the transport flips a module-private SEND_SNS flag, but no log is ever written into the returned stream here —
// actual SNS publishing (sendSns + its circuit-breaker that disables SEND_SNS on first failure) requires real AWS credentials and is integration-only.

describe("createSnsTransport", () => {

	describe("options validation", () => {

		test(`missing options throws`, () => {
			expect(() => createSnsTransport(undefined as never)).toThrow(TypeError);
			expect(() => createSnsTransport(undefined as never)).toThrow(
				`The "options" argument must be an object: { clientConfig, subject }. Received undefined`
			);
		});

		test(`null options throws with "Received null"`, () => {
			expect(() => createSnsTransport(null as never)).toThrow(
				`The "options" argument must be an object: { clientConfig, subject }. Received null`
			);
		});

		test(`an empty object reports the options error (missing keys are checked with in)`, () => {
			expect(() => createSnsTransport({} as never)).toThrow(
				`The "options" argument must be an object: { clientConfig, subject }. Received type object ([object Object])`
			);
		});

		test(`missing clientConfig reports the options error`, () => {
			expect(() => createSnsTransport({ subject:"s" } as never)).toThrow(/The "options" argument/);
		});

		test(`missing subject reports the options error`, () => {
			expect(() => createSnsTransport({ clientConfig:validClientConfig } as never)).toThrow(/The "options" argument/);
		});

	});

	describe("clientConfig validation", () => {

		test(`an invalid region fails isSnsClientConfig and throws the clientConfig error`, () => {
			const bad = { ...validClientConfig, region:"mars-1" } as unknown as SnsClientConfig;
			expect(() => createSnsTransport({ subject:"s", clientConfig:bad })).toThrow(
				`The "options.clientConfig" argument must be an object: { accessKeyId, region, secretAccessKey, topicArn }. Received type object ([object Object])`
			);
		});

		test(`a non-string accessKeyId fails the guard`, () => {
			const bad = { ...validClientConfig, accessKeyId:5 } as unknown as SnsClientConfig;
			expect(() => createSnsTransport({ subject:"s", clientConfig:bad })).toThrow(/options\.clientConfig/);
		});

		test(`a nullish clientConfig fails the guard`, () => {
			expect(() => createSnsTransport({ subject:"s", clientConfig:null as never })).toThrow(/options\.clientConfig/);
		});

	});

	describe("subject validation", () => {

		test(`an empty string throws`, () => {
			expect(() => createSnsTransport({ subject:"", clientConfig:validClientConfig })).toThrow(
				`The "options.subject" argument must be a string. Received type string ('')`
			);
		});

		test(`QUIRK: a whitespace-only subject is a string but fails the trim check — the message misleadingly says it "must be a string"`, () => {
			expect(() => createSnsTransport({ subject:"   ", clientConfig:validClientConfig })).toThrow(
				`The "options.subject" argument must be a string. Received type string ('   ')`
			);
		});

		test(`a non-string subject throws`, () => {
			expect(() => createSnsTransport({ subject:42 as never, clientConfig:validClientConfig })).toThrow(
				`The "options.subject" argument must be a string. Received type number (42)`
			);
		});

		test(`a non-empty trimmed subject passes`, () => {
			expect(() => createSnsTransport({ subject:"RPG Sage", clientConfig:validClientConfig })).not.toThrow();
		});

	});

	describe("transport construction", () => {

		test(`valid options return a Duplex stream (pino-abstract-transport)`, async () => {
			const { Duplex } = await import("node:stream");
			const transport = createSnsTransport({ subject:"RPG Sage - {level}", clientConfig:validClientConfig });
			expect(transport).toBeInstanceOf(Duplex);
		});

		test(`the transport exposes stream event plumbing`, () => {
			const transport = createSnsTransport({ subject:"s", clientConfig:validClientConfig });
			expect(typeof transport.on).toBe("function");
			expect(typeof transport.write).toBe("function");
		});

	});

});
