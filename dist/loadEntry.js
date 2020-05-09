var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
export var loadScript = function (root, src, appName) {
    return new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        if (appName) {
            script.setAttribute('micro-app', appName);
        }
        // external script
        script.setAttribute('src', src);
        script.addEventListener('load', function () { return resolve(); }, false);
        script.addEventListener('error', function () { return reject(new Error("js asset loaded error: " + src)); });
        root.appendChild(script);
    });
};
export var loadCSS = function (root, src, appName) {
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
var loadScripts = function (scripts, appName) {
    var appLoadStatus = loadStatus[appName];
    var resolve;
    var reject;
    var scriptLoadStatus = new Promise(function (res, rej) {
        resolve = res;
        reject = rej;
    });
    var loop = function (src) {
        if (src) {
            if (!appLoadStatus[src]) {
                appLoadStatus[src] = loadScript(document.body, src, appName);
            }
            appLoadStatus[src].then(function () {
                appLoadStatus[src] = Promise.resolve();
                if (scripts.length) {
                    loop(scripts.shift());
                }
                else {
                    resolve();
                }
            }, function (e) {
                appLoadStatus[src] = null;
                reject(e);
            });
        }
    };
    loop(scripts.shift());
    return scriptLoadStatus;
};
export default function (entry, appName) {
    if (!loadStatus[appName]) {
        loadStatus[appName] = {};
    }
    var appLoadStatus = loadStatus[appName];
    var scriptLoadStatus = loadScripts(__spreadArrays(entry.js), appName);
    var styleLoadStatus = (entry.css || []).map(function (src) {
        if (!appLoadStatus[src]) {
            appLoadStatus[src] = loadCSS(document.head, src, appName).then(function () {
                appLoadStatus[src] = Promise.resolve();
            });
        }
        return appLoadStatus[src];
    });
    return Promise.all(__spreadArrays([scriptLoadStatus], styleLoadStatus));
}
