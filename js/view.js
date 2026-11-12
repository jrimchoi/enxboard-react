define("DS/ENXBoardReact/js/view", ["DS/React18Loader/React", "DS/React18Loader/ReactDomClient"], function (React, ReactDOM) {
    var h = React.createElement;

    function icon(name) {
        return h("i", { className: "wux-ui-3ds wux-ui-3ds-" + name, "aria-hidden": "true" });
    }

    function heading(state) {
        if (state.screen === "detail" && state.post) {
            return state.post.title;
        }
        if (state.screen === "create") {
            return "새 글";
        }
        if (state.screen === "edit") {
            return "글 수정";
        }
        return "게시판";
    }

    function readForm(form) {
        return {
            title: form.title.value,
            author: form.author.value,
            date: form.date.value,
            content: form.content.value,
            tags: form.tags.value,
        };
    }

    function Board(props) {
        var state = props.state;
        var command = props.onCommand;
        var post = state.post || { title: "", author: "", date: "", content: "", tags: [] };
        var tags = Array.isArray(post.tags) ? post.tags.join(", ") : post.tags || "";
        var blocks = [
            h("header", { key: "header" }, h("h1", null, icon("list"), " ", heading(state))),
        ];
        if (state.notice) {
            blocks.push(h("p", { key: "notice", className: "notice" }, state.notice));
        }
        if (state.errors && state.errors.length) {
            blocks.push(
                h(
                    "ul",
                    { key: "errors", className: "errors" },
                    state.errors.map(function (error) {
                        return h("li", { key: error }, error);
                    })
                )
            );
        }
        if (!state.list && state.screen === "list") {
            blocks.push(h("p", { key: "loading" }, "게시판을 불러오는 중입니다."));
            return h("div", null, blocks);
        }
        if (state.screen === "list") {
            var list = state.list;
            blocks.push(
                h(
                    "form",
                    {
                        key: "search-" + state.query,
                        className: "toolbar",
                        onSubmit: function (event) {
                            event.preventDefault();
                            command("search", { query: event.target.query.value });
                        },
                    },
                    icon("search"),
                    h("input", {
                        name: "query",
                        type: "search",
                        defaultValue: state.query,
                        placeholder: "제목, 작성자, 본문, 태그",
                    }),
                    h("button", { type: "submit" }, "검색"),
                    h("button", { type: "button", onClick: function () { command("create", {}); } }, icon("plus"), " 새 글")
                )
            );
            blocks.push(h("p", { key: "count", className: "count" }, "전체 " + list.total + "건, " + list.page + " / " + list.pageCount + "쪽"));
            var rows = list.items.length
                ? list.items.map(function (item) {
                      return h(
                          "tr",
                          { key: item.id },
                          h("td", null, h("button", { type: "button", className: "link", onClick: function () { command("open", { id: item.id }); } }, item.title)),
                          h("td", null, item.author),
                          h("td", null, item.date),
                          h("td", null, item.tags.join(", "))
                      );
                  })
                : [h("tr", { key: "empty" }, h("td", { colSpan: 4, className: "empty" }, "검색 결과가 없습니다."))];
            blocks.push(
                h(
                    "div",
                    { key: "grid", className: "grid-host" },
                    h("table", null, h("thead", null, h("tr", null, h("th", null, "제목"), h("th", null, "작성자"), h("th", null, "날짜"), h("th", null, "태그"))), h("tbody", null, rows))
                )
            );
            blocks.push(
                h(
                    "div",
                    { key: "pager", className: "pager" },
                    h(
                        "button",
                        {
                            type: "button",
                            disabled: list.page <= 1,
                            onClick: function () { command("page", { page: list.page - 1 }); },
                        },
                        icon("left"),
                        " 이전"
                    ),
                    h(
                        "button",
                        {
                            type: "button",
                            disabled: list.page >= list.pageCount,
                            onClick: function () { command("page", { page: list.page + 1 }); },
                        },
                        "다음"
                    )
                )
            );
        } else if (state.screen === "detail" && state.post) {
            blocks.push(h("p", { key: "meta", className: "meta" }, state.post.author + " · " + state.post.date));
            blocks.push(h("p", { key: "tags" }, state.post.tags.join(", ")));
            blocks.push(h("article", { key: "content", className: "content" }, state.post.content));
            blocks.push(
                h(
                    "div",
                    { key: "actions", className: "actions" },
                    h("button", { type: "button", onClick: function () { command("back", {}); } }, icon("left"), " 목록"),
                    h("button", { type: "button", onClick: function () { command("edit", { id: state.post.id }); } }, icon("pencil"), " 수정"),
                    h("button", { type: "button", onClick: function () { command("delete", { id: state.post.id }); } }, icon("trash"), " 삭제")
                )
            );
        } else {
            blocks.push(
                h(
                    "form",
                    {
                        key: "editor-" + state.screen + "-" + (post.id || "new"),
                        className: "editor",
                        onSubmit: function (event) {
                            event.preventDefault();
                            command("save", { fields: readForm(event.target) });
                        },
                    },
                    h("label", null, "제목", h("input", { name: "title", defaultValue: post.title })),
                    h("label", null, "작성자", h("input", { name: "author", defaultValue: post.author })),
                    h("label", null, "날짜", h("input", { name: "date", defaultValue: post.date })),
                    h("label", null, "본문", h("textarea", { name: "content", rows: 8, defaultValue: post.content })),
                    h("label", null, "태그", h("input", { name: "tags", defaultValue: tags })),
                    h(
                        "div",
                        { className: "actions" },
                        h("button", { type: "button", onClick: function () { command("cancel", {}); } }, icon("left"), " 취소"),
                        h("button", { type: "submit" }, icon("check"), " 저장")
                    )
                )
            );
        }
        return h("div", null, blocks);
    }

    function mount(root, onCommand) {
        var rootApi = ReactDOM.createRoot(root);
        return function paint(state) {
            rootApi.render(h(Board, { state: state, onCommand: onCommand }));
        };
    }

    return { mount: mount };
});
