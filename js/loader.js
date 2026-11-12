(function (global) {
    var APP = "DS/ENXBoardReact/";
    var defined = {};
    var pending = {};
    var loading = {};
    var jobs = [];
    var queue = [];
    var pumping = false;
    var inflight = null;
    var paths = {
        react: "./vendor/react/react.production.min.js",
        "react-dom": "./vendor/react-dom/react-dom.production.min.js",
        "react-dom/client": "./vendor/react-dom/client.js",
        "DS/ENXBoard/js/model": "./vendor/enxboard/js/model.js",
        "DS/ENXBoard/js/collection": "./vendor/enxboard/js/collection.js",
        "DS/ENXBoard/js/data": "./vendor/enxboard/js/data.js",
        "DS/ENXBoard/js/widget": "./vendor/enxboard/js/widget.js",
        "DS/ENXBoard/js/controller": "./vendor/enxboard/js/controller.js",
    };

    function canonical(id) {
        if (id === "DS/React18Loader/React") {
            return "react";
        }
        if (id === "DS/React18Loader/ReactDom") {
            return "react-dom";
        }
        if (id === "DS/React18Loader/ReactDomClient") {
            return "react-dom/client";
        }
        return id;
    }

    function urlFor(id) {
        if (paths[id]) {
            return paths[id];
        }
        if (id.indexOf(APP) === 0) {
            return "./" + id.slice(APP.length) + ".js";
        }
        throw new Error("이 로더는 이 위젯 모듈만 읽습니다: " + id);
    }

    function isReady(id) {
        return id === "exports" || Object.prototype.hasOwnProperty.call(defined, canonical(id));
    }

    function values(deps, exportsObject) {
        return deps.map(function (id) {
            if (id === "exports") {
                return exportsObject;
            }
            return defined[canonical(id)];
        });
    }

    function fail(id) {
        var root = document.getElementById("board");
        var message = "모듈을 읽지 못했습니다: " + id;
        if (root) {
            root.textContent = message;
        }
        throw new Error(message);
    }

    function settle() {
        var moved = true;
        while (moved) {
            moved = false;
            Object.keys(pending).forEach(function (id) {
                var mod = pending[id];
                if (!mod || !mod.deps.every(isReady)) {
                    if (mod) {
                        mod.deps.forEach(load);
                    }
                    return;
                }
                var exportsObject = {};
                var returned = mod.factory.apply(null, values(mod.deps, exportsObject));
                defined[id] = returned !== undefined ? returned : exportsObject;
                delete pending[id];
                moved = true;
            });
        }
        jobs = jobs.filter(function (job) {
            if (!job.deps.every(isReady)) {
                return true;
            }
            job.callback.apply(null, values(job.deps, {}));
            return false;
        });
    }

    function pump() {
        if (pumping || !queue.length) {
            return;
        }
        pumping = true;
        var id = queue[0];
        var script = document.createElement("script");
        script.async = false;
        script.src = urlFor(id);
        inflight = id;
        script.onload = function () {
            queue.shift();
            pumping = false;
            inflight = null;
            settle();
            pump();
        };
        script.onerror = function () {
            fail(id);
        };
        document.head.appendChild(script);
    }

    function load(id) {
        id = canonical(id);
        if (!id || id === "exports" || defined[id] || pending[id] || loading[id]) {
            return;
        }
        loading[id] = true;
        queue.push(id);
        pump();
    }

    function define(id, deps, factory) {
        if (typeof id !== "string") {
            factory = deps;
            deps = id;
            id = inflight;
        }
        if (typeof deps === "function") {
            factory = deps;
            deps = [];
        }
        id = canonical(id);
        pending[id] = { deps: deps || [], factory: factory };
        settle();
    }

    define.amd = { ENXBoardReact: true };

    function require(deps, callback) {
        if (typeof deps === "string") {
            deps = [deps];
        }
        jobs.push({ deps: deps, callback: callback });
        deps.forEach(load);
        settle();
    }

    global.define = define;
    global.require = require;
})(window);
