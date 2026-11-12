define(
    "DS/ENXBoardReact/js/app",
    ["DS/ENXBoardReact/js/view", "DS/ENXBoard/js/controller"],
    function (View, createController) {
        function App(options) {
            var controller;
            var paint = View.mount(options.root, function (command, payload) {
                controller.handle(command, payload);
            });
            controller = createController({
                root: options.root,
                title: options.title || "ENXBoard",
                appId: options.appId || "ENXBoardReact",
                postsUrl: options.postsUrl || "./vendor/enxboard/data/posts.json",
                widget: options.widget,
                paint: paint,
            });
            this.controller = controller;
        }

        App.prototype.init = function () {
            return this.controller.init();
        };

        return App;
    }
);
