export type SubApp = {
    name: string;
    prefix: string;
    entries: {
        js: string[];
        css: string[];
    };
};
declare global {
    interface Window {
        __MICROAPP__: boolean;
        micro: {
            config: {
                [prop: string]: SubApp[];
            };
        };
    }
}
window.__MICROAPP__ = true;
const micro = window.micro || {
    config: {},
};
window.micro = micro;
export default micro;
