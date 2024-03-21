// store/index.js

import * as Vuex from 'vuex';
import getters from './getters';
import authModule from './modules/auth';

const modulesFiles = import.meta.glob('./modules/**/*.js',{ eager: true });

let modules = {};
for (const path in modulesFiles){
    const moduleName = path.replace(/(.*\/)*([^.]+).*/ig, "$2");
    modules[moduleName] = modulesFiles[path].default;
}

modules.auth = authModule;

const store = Vuex.createStore({
  modules,
  getters,
});

export default store;
