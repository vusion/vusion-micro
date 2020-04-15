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
import { registerApplication, start } from 'single-spa';
import { publish, subscribe, resetTopic } from 'vusion-micro-data';
import loadEntry from './loadEntry';
var registerApp = function (app) {
    registerApplication(app.name, function () {
        var topic = 'app:' + app.name;
        return Promise.resolve({
            bootstrap: function () {
                return loadEntry(app.entries, app.name).then(function () { return wrapReturnPromise(app.bootstrap); });
            },
            mount: function (customProps) {
                resetTopic(topic + ':unmounted');
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
                resetTopic(topic + ':mounted');
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
    }, app.isActive, app.customProps);
};
export default {
    getEntries: function (name) {
        return Promise.resolve(micro.config[name]);
    },
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
