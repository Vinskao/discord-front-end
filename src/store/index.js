import * as Vuex from 'vuex'
import getters from './getters'

const modulesFiles = import.meta.glob('./modules/**/*.js',{eager: true});

let modules = {};
for (const path in modulesFiles){
    const moduleName = path.replace(/(.*\/)*([^.]+).*/ig, "$2");
    modules[moduleName]  = modulesFiles[path].default;
}

const store = Vuex.createStore({
    modules,
    getters,
})

export default store
