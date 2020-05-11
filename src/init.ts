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
        micro: {
            config: {
                [prop: string]: SubApp[];
            };
            subApps: {
                [prop: string]: SubApp["entries"];
            };
        };
    }
}
const micro = window.micro || {
    config: {},
    subApps: {},
};
micro.config = micro.config || {};
micro.subApps = micro.subApps || {};
if (!window.micro) {
    window.micro = micro;
}
export default micro;
