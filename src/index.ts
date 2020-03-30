import micro, { SubApp } from './init';
import { wrapReturnPromise } from './utils';
import { registerApplication, start } from 'single-spa';
import { publish, subscribe } from 'vusion-micro-data';
import loadEntry from './loadEntry';

const registerApp = function (app): void {
    registerApplication(app.name, () => {
        const topic = 'app:' + app.name;
        return Promise.resolve({
            bootstrap(): Promise<any> {
                return loadEntry(app.entries, app.name).then(() => wrapReturnPromise(app.bootstrap));
            },
            mount(customProps): Promise<any> {
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
            unmount(customProps) {
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
    }, app.isActivity, app.customProps);
};
export default {
    getEntries(name: string): Promise<SubApp[]> {
        return Promise.resolve(micro.config[name]);
    },
    registerApps(appConfigs, appEntries): void {
        appEntries.forEach((item): void => {
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
