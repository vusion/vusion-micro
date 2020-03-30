export const wrapReturnPromise = function (func): Promise<any> {
    let out;
    if (!func) {
        out = Promise.resolve();
    } else {
        const result = func();
        if (result && result.then) {
            out = result;
        } else {
            out = Promise.resolve(result);
        }
    }
    return out;
};