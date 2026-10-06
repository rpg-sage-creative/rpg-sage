import { trace } from "@rsc-utils/logger-utils";

type PauseOptions<T> = {
	data: T;
	label?: string;
	log?: boolean;
	ms: number;
};

export async function pause(ms: number, label?: string): Promise<void>;
export async function pause<T>(options: PauseOptions<T>): Promise<T>;
export async function pause<T>(...args: unknown[]): Promise<void | T> {
	const first = args[0];
	const ms = (first as PauseOptions<T>).ms ?? args[0];
	const label = (first as PauseOptions<T>).label ?? args[1] as string ?? "Unlabeled";
	const data = (first as PauseOptions<T>).data ?? undefined;
	const log = (first as PauseOptions<T>).log;
	if (log) trace("Pausing for %dms: %s ...", ms, label); // NOSONAR
	await (new Promise(res => setTimeout(res, ms)));
	if (log) trace("Pausing for %dms: %s ... done.", ms, label); // NOSONAR
	return data;
}