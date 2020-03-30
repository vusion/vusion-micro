export var wrapReturnPromise = function (func) {
    var out;
    if (!func) {
        out = Promise.resolve();
    }
    else {
        var result = func();
        if (result && result.then) {
            out = result;
        }
        else {
            out = Promise.resolve(result);
        }
    }
    return out;
};
