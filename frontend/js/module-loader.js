/* Lazy script/CSS loading for code splitting */

const ModuleLoader = {
    scripts: new Set(),
    pending: new Map(),
    inited: new Set(),

    loadScript(src) {
        if (this.scripts.has(src)) return Promise.resolve();
        if (this.pending.has(src)) return this.pending.get(src);

        const promise = new Promise((resolve, reject) => {
            const el = document.createElement('script');
            el.src = src;
            el.async = true;
            el.onload = () => {
                this.scripts.add(src);
                this.pending.delete(src);
                resolve();
            };
            el.onerror = () => {
                this.pending.delete(src);
                reject(new Error(`Failed to load ${src}`));
            };
            document.body.appendChild(el);
        });

        this.pending.set(src, promise);
        return promise;
    },

    loadStyle(href, id) {
        if (id && document.getElementById(id)) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const el = document.createElement('link');
            el.rel = 'stylesheet';
            el.href = href;
            if (id) el.id = id;
            el.onload = () => resolve();
            el.onerror = () => reject(new Error(`Failed to load ${href}`));
            document.head.appendChild(el);
        });
    },

    async ensure(view) {
        const loaders = {
            analytics: async () => {
                await this.loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js');
                await this.loadScript('js/analytics.js');
                if (!this.inited.has('analytics')) {
                    AnalyticsDashboard.init();
                    this.inited.add('analytics');
                }
            },
            visualize: async () => {
                await this.loadStyle('css/visualizations.css', 'viz-css');
                await this.loadScript('js/visualizations.js');
                if (!this.inited.has('visualize')) {
                    Visualizations.init();
                    this.inited.add('visualize');
                }
            },
            learn: async () => {
                await this.loadStyle('css/education.css', 'edu-css');
                await this.loadScript('js/education.js');
                if (!this.inited.has('learn')) {
                    Education.init();
                    this.inited.add('learn');
                }
            },
            lab: async () => {
                await this.loadStyle('css/security-lab.css', 'lab-css');
                await this.loadScript('js/security-lab.js');
                if (!this.inited.has('lab')) {
                    SecurityLab.init();
                    this.inited.add('lab');
                }
            },
        };

        const loader = loaders[view];
        if (!loader) return;
        await loader();
    },
};

window.ModuleLoader = ModuleLoader;
