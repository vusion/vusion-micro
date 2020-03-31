import { SubApp } from './init';
const loadScript = function (root: HTMLElement, src: string, appName: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.setAttribute('micro-app', appName);
        // external script
        script.setAttribute('src', src);
        script.addEventListener('load', () => resolve(), false);
        script.addEventListener('error', () => reject(new Error(`js asset loaded error: ${src}`)));
        root.appendChild(script);
    });
};

const loadCSS = function (root: HTMLElement, src: string, appName: string): Promise<void> {
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
export default function (entry: SubApp["entries"], appName: string): Promise<void[]> {
    if (!loadStatus[appName]) {
        loadStatus[appName] = {};
    }
    const appLoadStatus = loadStatus[appName];
    const scriptLoadStatus = (entry.js || []).map((src: string): Promise<void> => {
        if (!appLoadStatus[src]) {
            appLoadStatus[src] = loadScript(document.body, src, appName).then(() => {
                appLoadStatus[src] = Promise.resolve();
            });
        }
        return appLoadStatus[src];
    });
    const styleLoadStatus = (entry.css || []).map((src: string): Promise<void> => {
        if (!appLoadStatus[src]) {
            appLoadStatus[src] = loadCSS(document.head, src, appName).then(() => {
                appLoadStatus[src] = Promise.resolve();
            });
        }
        return appLoadStatus[src];
    });
    return Promise.all([...scriptLoadStatus, ...styleLoadStatus]);
    
}
