# vusion-micro

## usage

### master

```js
// config.js
window.micro = window.micro || { config: {} };
window.micro.config.test = [
    {
        name: 'sub1',
        prefix: '/sub1',
        entries: {
            js: ['http://localhost:8090/public/sub1.js'],
            css: [

            ],
        },
    },
    {
        name: 'main',
        entries: {
            js: ['http://localhost:9030/public/main.js'],
            css: [

            ],
        },
    },
];
```

```js
import micro from 'vusion-micro';
if (DEV) {
    require('./config.js');
} else {
    // load config from https://vusion.163yun.com/micro
}
const sub1Activity = function (location) {
    const hash = location.hash.replace('#', '');
    const url = new URL(hash, location.origin);
    return url.pathname.startsWith('/sub1/') || url.pathname === '/sub1';
};
const customProps = {
    node: '#sub',
};
const render = function () {
    const container = document.getElementById('container');
    container.innerHTML = `<div id="sub"></div>`;
};
const config = {
    'sub1': {
        isActivity: sub1Activity,
        mount: render,
        customProps: {
            ...customProps,
            prefix: 'sub1',
        },
    },
    'main': {
        isActivity(location) {
            return !sub1Activity(location); // 所有独立出去的排除在外
        },
        mount: render,
        customProps: {
            ...customProps,
        },
    },
};
const entryFetch = micro.getEntries('test');
entryFetch.then((entries) => {
    micro.registerApps(config, entries);
});
```

### slave

```js
import Vue from 'vue';

import { initRouter } from './router';
import { publish, subscribe } from 'vusion-micro-data';

const App = Vue.extend({

});
let instance = null;
const topic = 'app:sub1';

subscribe(topic + ':mount', (data) => {
    const router = initRouter();
    instance = new App({
        router,
        template: '<router-view></router-view>',
    }).$mount(data.customProps.node);
    const cancel = publish(topic + ':mounted', new Date());
    cancel();
});
subscribe(topic + ':unmount', (data) => {
    instance.$destroy();
    const cancel = publish(topic + ':unmounted', new Date());
    cancel();
});

```