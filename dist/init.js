var micro = window.micro || {
    config: {},
    subApps: {},
};
micro.config = micro.config || {};
micro.subApps = micro.subApps || {};
if (!window.micro) {
    window.micro = micro;
}
export default micro;
