const loadScript = function (root, src, appName): Promise<void> {
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

const loadCSS = function (root, src, appName): Promise<void> {
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
const loaded = {

};
export default function (entry, appName): Promise<any[]> {
    if (!loaded[appName]) {
        loaded[appName] = {};
    }
    const p1 = (entry.scripts || []).map((src) => {
        if (!loaded[appName][src]) {
            return loadScript(document.body, src, appName).then(() => {
                loaded[appName][src] = true;
            });
        }
        return true;
    });
    const p2 = (entry.styles || []).map((src) => {
        if (!loaded[appName][src]) {
            return loadCSS(document.head, src, appName).then(() => {
                loaded[appName][src] = true;
            });
        }
        return true;
    });
    return Promise.all([...p1, ...p2]);
    
}
