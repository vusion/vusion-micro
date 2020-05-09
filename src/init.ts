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
        };
    }
}
const micro = window.micro || {
    config: {},
};
window.micro = micro;
export default micro;
