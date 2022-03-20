export default {
    isObject: (inp: any) => {
        return typeof inp === 'object' && inp !== null
    },
    isEmptyObject: (inp: any) => {
        return Object.keys(inp).length === 0 && Object.getPrototypeOf(inp) === Object.prototype
    }
}