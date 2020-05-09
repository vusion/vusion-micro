var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import micro from './init';
import { wrapReturnPromise } from './utils';
import { registerApplication, start, getAppNames, unloadApplication } from 'single-spa';
import { publish, subscribe, clearTopic } from 'vusion-micro-data';
import loadEntry, { loadScript } from './loadEntry';
var map = {};
var registerApp = function (app) {
    var customProps = app.customProps;
    if (getAppNames().includes(app.name)) {
        var preApp = map[app.name];
        var activeWhen_1 = preApp.activeWhen;
        app.activeWhen.forEach(function (k) {
            if (!activeWhen_1.includes(k)) {
                activeWhen_1.push(k);
            }
        });
        Object.assign(preApp.customProps, app.customProps);
        return;
    }
    map[app.name] = app;
    registerApplication({
        name: app.name,
        app: function () {
            var topic = 'app:' + app.name;
            return Promise.resolve({
                bootstrap: function () {
                    return loadEntry(app.entries, app.name).then(function () { return wrapReturnPromise(app.bootstrap); });
                },
                mount: function (customProps) {
                    clearTopic(topic + ':unmounted');
                    return new Promise(function (res, rej) {
                        var done = function () {
                            var clear = publish(topic + ':mount', {
                                customProps: customProps,
                            });
                            clear();
                            subscribe(topic + ':mounted', function () {
                                wrapReturnPromise(app.mounted).then(res, rej);
                            }, true);
                        };
                        wrapReturnPromise(app.mount).then(done, rej);
                    });
                },
                unmount: function (customProps) {
                    clearTopic(topic + ':mounted');
                    return new Promise(function (res, rej) {
                        var done = function () {
                            var clear = publish(topic + ':unmount', {
                                customProps: customProps,
                            });
                            clear();
                            subscribe(topic + ':unmounted', function () {
                                wrapReturnPromise(app.unmounted).then(res, rej);
                            }, true);
                        };
                        wrapReturnPromise(app.unmount).then(done, rej);
                    });
                },
            });
        },
        activeWhen: app.activeWhen,
        customProps: customProps,
    });
};
var unloadApp = function (name) {
    return unloadApplication(name);
};
export default {
    getEntries: function (name) {
        return Promise.resolve(micro.config[name]);
    },
    unloadApp: unloadApp,
    registerApp: registerApp,
    registerApps: function (appConfigs, appEntries) {
        appEntries.forEach(function (item) {
            var name = item.name;
            var config = appConfigs[name];
            if (!config) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error("[app]" + name + " miss config");
                }
            }
            registerApp(__assign(__assign({}, config), { name: name, entries: item.entries }));
        });
    },
    start: function () {
        start();
    },
    loadEntries: function (entries, masterName, slaveName) {
        var micro = window.micro;
        var microConfig = micro.config;
        var subApps = micro.subApps;
        var setEntries = function (entries) {
            var apps = microConfig[masterName] = microConfig[masterName] || [];
            if (!apps.map(function (i) { return i.name; }).includes(slaveName)) {
                apps.push({
                    name: slaveName,
                    entries: entries,
                });
            }
        };
        if (subApps[slaveName]) {
            setEntries(subApps[slaveName]);
            return Promise.resolve(subApps[slaveName]);
        }
        else if (entries) {
            if (typeof entries === 'string') {
                return loadScript(document.body, entries).then(function () {
                    setEntries(subApps[slaveName]);
                    return Promise.resolve(subApps[slaveName]);
                });
            }
            else if (entries.js) {
                setEntries(entries);
                return Promise.resolve(entries);
            }
            else {
                return Promise.reject('loadEntries error');
            }
        }
        else {
            return this.getEntries(masterName).then(function (appEntries) {
                return appEntries.find(function (item) { return item.name === slaveName; });
            });
        }
    },
};
