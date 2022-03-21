export function isObject(inp: unknown): boolean {
	return typeof inp === 'object' && inp !== null;
}

export function isEmptyObject(inp: unknown): boolean {
	return isObject(inp) && Object.keys(inp as Record<string, unknown>).length === 0 && Object.getPrototypeOf(inp) === Object.prototype;
}