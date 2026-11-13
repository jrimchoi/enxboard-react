/*
 * React 게시판 상태다. useState가 스냅샷을 통째로 바꾼다.
 * 상태가 바뀌면 Board가 다시 호출되고 JSX가 새 트리를 만든다.
 * Vue는 reactive 필드를 고치면 템플릿이 따라 그려지고, render를 부르지 않는다.
 * Next도 useState지만 페이지 파일 안에서 쓴다.
 * 글 목록은 이 훅 안에만 있다. define이나 require는 없다.
 */
import { useEffect, useRef, useState } from "react";
import { PAGE_SIZE, createPost, deletePost, findPost, normalize, pageOf, updatePost } from "./domain";
import { bindWidget } from "./widget";

var initial = {
    screen: "list",
    query: "",
    page: 1,
    sort: [{ dataIndex: "date", sort: "desc" }],
    posts: [],
    list: null,
    post: null,
    errors: [],
    notice: "",
    loadError: "",
};

export function useBoard() {
    var pair = useState(initial);
    var state = pair[0];
    var setState = pair[1];
    var stateRef = useRef(state);
    stateRef.current = state;
    var widgetRef = useRef(null);
    var startedRef = useRef(false);
    var refreshTimer = useRef(0);

    function commit(partial) {
        var next = Object.assign({}, stateRef.current, partial);
        stateRef.current = next;
        setState(next);
        return next;
    }

    function showList(base) {
        var current = base || stateRef.current;
        var list = pageOf(current.posts, current.page, PAGE_SIZE, current.query, current.sort);
        return commit(Object.assign({}, current, { screen: "list", list: list, page: list.page, post: null, errors: [] }));
    }

    function showDetail(id, base) {
        var current = base || stateRef.current;
        var found = findPost(current.posts, id);
        if (!found) return commit(Object.assign({}, current, { errors: ["글을 찾지 못했습니다."] }));
        return commit(Object.assign({}, current, { screen: "detail", post: normalize(found), errors: [] }));
    }

    function handle(command, payload) {
        payload = payload || {};
        var current = stateRef.current;
        if (command === "search") {
            if (widgetRef.current && widgetRef.current.setValue) widgetRef.current.setValue("query", payload.query || "");
            showList(Object.assign({}, current, { query: payload.query || "", page: 1, notice: "" }));
            return;
        }
        if (command === "page") {
            showList(Object.assign({}, current, { page: payload.page }));
            return;
        }
        if (command === "sort") {
            var sort = payload.sortModel && payload.sortModel.length ? payload.sortModel : [{ dataIndex: "date", sort: "desc" }];
            showList(Object.assign({}, current, { sort: sort, page: 1 }));
            return;
        }
        if (command === "open") {
            showDetail(payload.id, Object.assign({}, current, { notice: "" }));
            return;
        }
        if (command === "create") {
            commit(Object.assign({}, current, { errors: [], notice: "", screen: "create", post: null }));
            return;
        }
        if (command === "edit") {
            var opened = showDetail(payload.id, Object.assign({}, current, { errors: [] }));
            if (opened.post) commit(Object.assign({}, stateRef.current, { screen: "edit" }));
            return;
        }
        if (command === "delete") {
            if (!window.confirm("이 글을 삭제할까요?")) return;
            var removed = deletePost(current.posts, payload.id);
            if (!removed.ok) {
                commit(Object.assign({}, current, { errors: removed.errors }));
                return;
            }
            showList(Object.assign({}, current, { posts: removed.posts, notice: "글을 삭제했습니다.", page: 1 }));
            return;
        }
        if (command === "save") {
            var editingId = current.post && current.post.id;
            var result = current.screen === "create" ? createPost(current.posts, payload.fields) : updatePost(current.posts, editingId, payload.fields);
            if (!result.ok) {
                commit(Object.assign({}, current, {
                    errors: result.errors,
                    post: Object.assign({ id: editingId || "" }, normalize(payload.fields)),
                }));
                return;
            }
            var notice = current.screen === "create" ? "글을 등록했습니다." : "글을 수정했습니다.";
            showDetail(result.post.id, Object.assign({}, current, { posts: result.posts, notice: notice, errors: [] }));
            return;
        }
        if (command === "back" || command === "cancel") {
            if (command === "cancel" && current.screen === "edit" && current.post && current.post.id) {
                showDetail(current.post.id, Object.assign({}, current, { errors: [] }));
                return;
            }
            showList(Object.assign({}, current, { errors: [] }));
        }
    }

    function start() {
        if (startedRef.current) return;
        startedRef.current = true;
        var widget = widgetRef.current;
        if (widget && widget.setValue) widget.setValue("tenantAware", true);
        if (widget && widget.setTitle) widget.setTitle("ENXBoard");
        fetch("/data/posts.json")
            .then(function (response) {
                if (!response.ok) throw new Error("목 데이터를 읽지 못했습니다.");
                return response.json();
            })
            .then(function (rows) {
                var saved = widget && widget.getValue && widget.getValue("query");
                showList(Object.assign({}, stateRef.current, {
                    posts: rows.map(normalize),
                    query: typeof saved === "string" ? saved : stateRef.current.query,
                }));
            })
            .catch(function (error) {
                commit({ loadError: (error && error.message) || "게시판을 시작하지 못했습니다." });
            });
    }

    useEffect(function () {
        widgetRef.current = bindWidget({
            onLoad: start,
            onRefresh: function () {
                if (!stateRef.current.list) return;
                window.clearTimeout(refreshTimer.current);
                refreshTimer.current = window.setTimeout(function () {
                    showList();
                }, 1000);
            },
            onSearch: function (data) {
                var query = "";
                if (typeof data === "string") query = data;
                else if (data && typeof data.query === "string") query = data.query;
                else if (data && typeof data.searchQuery === "string") query = data.searchQuery;
                handle("search", { query: query });
            },
        });
        start();
    }, []);

    return { state: state, handle: handle };
}
