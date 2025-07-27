import { type BufferHandlerJsonError, type BufferHandlerResponse } from "@rsc-utils/io-utils";
// import type { Callback, Context } from "aws-lambda";
import { serverHandler } from "./serverHandler.js";
import { type MapRenderResponse } from "./types/MapRenderResponse.js";

// npm install aws-lambda @types/aws-lambda

/** @todo sort out lambda stuff */
type Context = { callbackWaitsForEmptyEventLoop?:boolean; };
/** @todo sort out lambda stuff */
type Callback<T> = (_: unknown, response: T) => void;

type PayloadEvent = { body:string; };
type ResponseCallback = Callback<BufferHandlerResponse<MapRenderResponse | BufferHandlerJsonError>>;

/** AWS Lambda handler */
export async function handler(payloadEvent: PayloadEvent, context: Context, callback: ResponseCallback) {
	context.callbackWaitsForEmptyEventLoop;
	const mapRenderPayload = JSON.parse(payloadEvent.body);
	const response = await serverHandler(mapRenderPayload);
	callback(null, response);
};