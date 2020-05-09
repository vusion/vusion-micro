import { SubApp } from './init';
export const loadScript = function (root: HTMLElement, src: string, appName?: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        if (appName) {
            script.setAttribute('micro-app', appName);
        }
        // external script
        script.setAttribute('src', src);
        script.addEventListener('load', () => resolve(), false);
        script.addEventListener('error', () => reject(new Error(`js asset loaded error: ${src}`)));
        root.appendChild(script);
    });
};

export const loadCSS = function (root: HTMLElement, src: string, appName: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const element = document.createElement('link');
        element.rel = 'stylesheet';
        element.href = src;
        element.setAttribute('micro-app', appName);
        element.addEventListener(
            'error',
            () => reject(new Error(`css asset loaded error: ${src}`)),
            false,
        );
        element.addEventListener('load', () => resolve(), false);

        root.appendChild(element);
    });
};
const loadStatus = {};

const loadScripts = function (scripts, appName): Promise<any> {
    const appLoadStatus = loadStatus[appName];
    let resolve;
    let reject;

    const scriptLoadStatus = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    const loop = function(src: string|void): void {
        if (src) {
            if (!appLoadStatus[src]) {
                appLoadStatus[src] = loadScript(document.body, src, appName);
            }
            appLoadStatus[src].then(() => {
                appLoadStatus[src] = Promise.resolve();
                if (scripts.length) {
                    loop(scripts.shift());
                } else {
                    resolve();
                }
            }, (e) => {
                appLoadStatus[src] = null;
                reject(e);
            });
        }
    };
    loop(scripts.shift());
    return scriptLoadStatus;
};
export default function (entry: SubApp["entries"], appName: string): Promise<void[]> {
    if (!loadStatus[appName]) {
        loadStatus[appName] = {};
    }
    const appLoadStatus = loadStatus[appName];
    const scriptLoadStatus = loadScripts([...entry.js], appName);
    
    const styleLoadStatus = (entry.css || []).map((src: string): Promise<void> => {
        if (!appLoadStatus[src]) {
            appLoadStatus[src] = loadCSS(document.head, src, appName).then(() => {
                appLoadStatus[src] = Promise.resolve();
            });
        }
        return appLoadStatus[src];
    });
    return Promise.all([scriptLoadStatus, ...styleLoadStatus]);
    
}
