import micro, { SubApp } from './init';
import { wrapReturnPromise } from './utils';
import { registerApplication, start, getAppNames, unloadApplication } from 'single-spa';
import { publish, subscribe, clearTopic } from 'vusion-micro-data';
import loadEntry from './loadEntry';
type AppConfigs = {
    [prop: string]: AppConfig;
};
type AppConfig = {
    activeWhen: string[];
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
        const activeWhen = preApp.activeWhen;
        app.activeWhen.forEach((k) => {
            if (!activeWhen.includes(k)) {
                activeWhen.push(k);
            }
        });
        Object.assign(preApp.customProps, app.customProps);
        return;
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
        activeWhen: app.activeWhen,
        customProps,
    });
};
const unloadApp = function(name: string): ReturnType<typeof unloadApplication> {
    return unloadApplication(name);
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
};
