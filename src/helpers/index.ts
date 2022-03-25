import { KeyValue } from '../types';

export function isObject(inp: unknown): boolean {
	return typeof inp === 'object' && inp !== null;
}

export function isEmptyObject(inp: unknown): boolean {
	return isObject(inp)
		&& Object.keys(inp as Record<string, unknown>).length === 0
		&& Object.getPrototypeOf(inp) === Object.prototype;
}

export function forin(
	object: KeyValue<unknown>,
	callback: (key: string, value: unknown) => void,
): void {
	Object.keys(object).forEach((key) => {
		callback(key, object[key]);
	});
}
