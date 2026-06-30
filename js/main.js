const { reactive, createApp } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

import routes from './routes.js';

// --- Global store ---
export const store = reactive({
    dark: JSON.parse(localStorage.getItem('dark')) ?? false,

    toggleDark() {
        this.dark = !this.dark;
        localStorage.setItem('dark', JSON.stringify(this.dark));
    },
});

// --- App ---
const app = createApp({
    data() {
        return {
            store
        };
    }
});

// --- Router ---
const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

// --- Plugins ---
app.use(router);

// --- Mount ---
app.mount('#app');
