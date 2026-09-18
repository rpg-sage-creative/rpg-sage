export type AppServerEndpoint = {
	secure: boolean;
	hostname: string;
	port: number;
};

export type BufferHandlerJsonError = {
	error: string;
};

export type BufferHandlerResponse<T> = {
	statusCode: number;
	contentType: string;
	body: T;
};

export type BufferHandler<T> = (buffer: Buffer) => Promise<BufferHandlerResponse<T | BufferHandlerJsonError>>;
