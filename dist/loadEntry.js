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
var loadStatus = {};
export default function (entry, appName) {
    if (!loadStatus[appName]) {
        loadStatus[appName] = {};
    }
    var appLoadStatus = loadStatus[appName];
    var scriptLoadStatus = (entry.js || []).map(function (src) {
        if (!appLoadStatus[src]) {
            appLoadStatus[src] = loadScript(document.body, src, appName).then(function () {
                appLoadStatus[src] = Promise.resolve();
            });
        }
        return appLoadStatus[src];
    });
    var styleLoadStatus = (entry.css || []).map(function (src) {
        if (!appLoadStatus[src]) {
            appLoadStatus[src] = loadCSS(document.head, src, appName).then(function () {
                appLoadStatus[src] = Promise.resolve();
            });
        }
        return appLoadStatus[src];
    });
    return Promise.all(__spreadArrays(scriptLoadStatus, styleLoadStatus));
}
