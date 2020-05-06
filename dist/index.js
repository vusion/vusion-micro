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
import loadEntry from './loadEntry';
var registerApp = function (app) {
    var customProps = app.customProps;
    if (getAppNames().includes(app.name)) {
        console.warn('repeat register:' + app.name);
        return;
    }
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
        activeWhen: app.isActive,
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
};
