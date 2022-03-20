export function isObject(inp: unknown): boolean {
	return typeof inp === 'object' && inp !== null;
}

export function isEmptyObject(inp: unknown) {
	return isObject(inp) && Object.keys(inp as Object).length === 0 && Object.getPrototypeOf(inp) === Object.prototype;
}