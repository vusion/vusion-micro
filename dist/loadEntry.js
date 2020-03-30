var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var loadScript = function (root, src, appName) {
    return new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.setAttribute('micro-app', appName);
        // external script
        script.setAttribute('src', src);
        script.addEventListener('load', function () { return resolve(); }, false);
        script.addEventListener('error', function () { return reject(new Error("js asset loaded error: " + src)); });
        root.appendChild(script);
    });
};
var loadCSS = function (root, src, appName) {
    return new Promise(function (resolve, reject) {
        var element = document.createElement('link');
        element.rel = 'stylesheet';
        element.href = src;
        element.setAttribute('micro-app', appName);
        element.addEventListener('error', function () { return reject(new Error("css asset loaded error: " + src)); }, false);
        element.addEventListener('load', function () { return resolve(); }, false);
        root.appendChild(element);
    });
};
var loaded = {};
export default function (entry, appName) {
    if (!loaded[appName]) {
        loaded[appName] = {};
    }
    var p1 = (entry.scripts || []).map(function (src) {
        if (!loaded[appName][src]) {
            return loadScript(document.body, src, appName).then(function () {
                loaded[appName][src] = true;
            });
        }
        return true;
    });
    var p2 = (entry.styles || []).map(function (src) {
        if (!loaded[appName][src]) {
            return loadCSS(document.head, src, appName).then(function () {
                loaded[appName][src] = true;
            });
        }
        return true;
    });
    return Promise.all(__spreadArrays(p1, p2));
}
