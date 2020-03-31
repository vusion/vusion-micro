export const wrapReturnPromise = function (func?: Function): Promise<any> {
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