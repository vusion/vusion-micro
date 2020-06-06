import micro, { SubApp } from './init';
import { wrapReturnPromise } from './utils';
import { registerApplication, start, getAppNames, unloadApplication, ActivityFn, pathToActiveWhen } from 'single-spa';
import { publish, subscribe, clearTopic } from 'vusion-micro-data';
import loadEntry, { loadScript } from './loadEntry';
type AppConfigs = {
    [prop: string]: AppConfig;
};
type AppConfig = {
    urlRule: string[];
    activeWhen: Function;
    mount?: Function;
    bootstrap?: Function;
    unmounted?: Function;
    unmount?: Function;
    mounted?: Function;
    customProps: {
        node?: string;
        [props: string]: any;
    };
};
type App = {
    name: string;
    entries: SubApp["entries"];
} & AppConfig;
const map = {};
const registerApp = function (app: App): void {
    const customProps = app.customProps;
    if (getAppNames().includes(app.name)) {
        const preApp = map[app.name];
        const urlRule = preApp.urlRule;
        app.urlRule.forEach((k) => {
            if (!urlRule.includes(k)) {
                urlRule.push(k);
            }
        });
        Object.assign(preApp.customProps, app.customProps);
        return;
    } else {
        app.activeWhen = function(location): boolean {
            return app.urlRule.map((i) => {
                return typeof i === 'function' ? i : pathToActiveWhen(i);
            }).some((fn) => fn(location));
        };
    }
    map[app.name] = app;
    registerApplication({
        name: app.name,
        app: () => {
            const topic = 'app:' + app.name;
            return Promise.resolve({
                bootstrap(): Promise<any> {
                    return loadEntry(app.entries, app.name).then(() => wrapReturnPromise(app.bootstrap));
                },
                mount(customProps): Promise<any> {
                    clearTopic(topic + ':unmounted');
                    return new Promise((res, rej): void => {
                        const done = function (): void {
                            const clear = publish(topic + ':mount', {
                                customProps,
                            });
                            clear();
                            subscribe(topic + ':mounted', (): void => {
                                wrapReturnPromise(app.mounted).then(res, rej);
                            }, true);
                        };
                        wrapReturnPromise(app.mount).then(done, rej);
                    });
                },
                unmount(customProps): Promise<any> {
                    clearTopic(topic + ':mounted');
                    return new Promise((res, rej): void => {
                        const done = function (): void {
                            const clear = publish(topic + ':unmount', {
                                customProps,
                            });
                            clear();
                            subscribe(topic + ':unmounted', (): void => {
                                wrapReturnPromise(app.unmounted).then(res, rej);
                            }, true);
                        };
                        wrapReturnPromise(app.unmount).then(done, rej);
                    });
                },
            });
        },
        activeWhen: app.activeWhen as ActivityFn,
        customProps,
    });
};
const unloadApp = function (name: string): ReturnType<typeof unloadApplication> {
    if (getAppNames().includes(name)) {
        return unloadApplication(name);
    } else {
        return Promise.resolve();
    }
};
export default {
    getEntries(name: string): Promise<SubApp[]> {
        return Promise.resolve(micro.config[name]);
    },
    unloadApp,
    registerApp,
    registerApps(appConfigs: AppConfigs, appEntries: SubApp[]): void {
        appEntries.forEach((item: SubApp): void => {
            const name = item.name;
            const config = appConfigs[name];
            if (!config) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(`[app]${name} miss config`);
                }
            }
            registerApp({
                ...config,
                name,
                entries: item.entries,
            });
        });
    },
    start(): void {
        start();
    },
    loadEntries(entries, masterName: string, slaveName: string): Promise<SubApp["entries"]|string> {
        const micro = window.micro;
        const microConfig = micro.config;
        const subApps = micro.subApps;
        const setEntries = (entries: SubApp["entries"]): void => {
            const apps = microConfig[masterName] = microConfig[masterName] || [];
            if (!apps.map((i) => i.name).includes(slaveName)) {
                apps.push({
                    name: slaveName,
                    entries,
                } as SubApp);
            }
        };
        if (subApps[slaveName]) {
            setEntries(subApps[slaveName]);
            return Promise.resolve(subApps[slaveName]);
        } else if (entries) {
            if (typeof entries === 'string') {
                return loadScript(document.body, entries).then(() => {
                    setEntries(subApps[slaveName]);
                    return Promise.resolve(subApps[slaveName]);
                });
            } else if (entries.js) {
                setEntries(entries);
                return Promise.resolve(entries);
            } else {
                return Promise.reject('loadEntries error');
            }
        } else {
            return this.getEntries(masterName).then((appEntries) => {
                return appEntries.find((item) => item.name === slaveName);
            });
        }
    },
};
