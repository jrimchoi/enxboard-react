/*
 * React 함수 컴포넌트다. JSX를 반환하고, 상태가 바뀌면 이 함수가 다시 실행된다.
 * 입력은 defaultValue가 아니라 컴포넌트 state라서 글자가 지워지지 않는다.
 * Vue는 같은 화면을 Board.vue 템플릿과 v-model로 그린다.
 * Next의 components/Board.js도 JSX지만 Next가 페이지에서 그 컴포넌트를 부른다.
 */
import { useEffect, useState } from "react";
import { useBoard } from "./useBoard";
import { DataGrid } from "./grid/DataGrid";

var columns = [
    { text: "제목", dataIndex: "tree", width: 280, editableFlag: true },
    { text: "작성자", dataIndex: "author", width: 120, editableFlag: true },
    { text: "날짜", dataIndex: "date", typeRepresentation: "date", width: 120, editableFlag: true },
    { text: "태그", dataIndex: "tags", width: 160, editableFlag: true },
];

function Icon(props) {
    return <i className={"wux-ui-3ds wux-ui-3ds-" + props.name} aria-hidden="true" />;
}

function heading(state) {
    if (state.screen === "detail" && state.post) return state.post.title;
    if (state.screen === "create") return "새 글";
    if (state.screen === "edit") return "글 수정";
    return "게시판";
}

export default function Board() {
    var board = useBoard();
    var state = board.state;
    var formPair = useState({ title: "", author: "", date: "", content: "", tags: "" });
    var form = formPair[0];
    var setForm = formPair[1];

    useEffect(function () {
        var post = state.post || {};
        setForm({
            title: post.title || "",
            author: post.author || "",
            date: post.date || "",
            content: post.content || "",
            tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
        });
    }, [state.screen, state.post && state.post.id, state.errors.join("|")]);

    function setField(name, value) {
        setForm(function (current) {
            var next = Object.assign({}, current);
            next[name] = value;
            return next;
        });
    }

    if (state.loadError) return <p>{state.loadError}</p>;
    if (!state.list && state.screen === "list") return <p>게시판을 불러오는 중입니다.</p>;

    return (
        <div>
            <header>
                <h1>
                    <Icon name="list" /> {heading(state)}
                </h1>
            </header>
            {state.notice ? <p className="notice">{state.notice}</p> : null}
            {state.errors.length ? (
                <ul className="errors">
                    {state.errors.map(function (error) {
                        return <li key={error}>{error}</li>;
                    })}
                </ul>
            ) : null}
            {state.screen === "list" ? (
                <div>
                    <form
                        className="toolbar"
                        onSubmit={function (event) {
                            event.preventDefault();
                            board.handle("search", { query: event.target.query.value });
                        }}
                    >
                        <Icon name="search" />
                        <input name="query" type="search" defaultValue={state.query} key={state.query} placeholder="제목, 작성자, 본문, 태그" />
                        <button type="submit">검색</button>
                        <button type="button" onClick={function () { board.handle("create", {}); }}>
                            <Icon name="plus" /> 새 글
                        </button>
                    </form>
                    <p className="count">
                        전체 {state.list.total}건, {state.list.page} / {state.list.pageCount}쪽
                    </p>
                    <div className="grid-host">
                        <DataGrid
                            identifier="enxboard"
                            rows={state.list.items}
                            columns={columns}
                            sortModel={state.sort}
                            filters={state.filters}
                            findQuery={state.query}
                            rowSelection="multiple"
                            emptyText="검색 결과가 없습니다."
                            onSort={function (sortModel) { board.handle("sort", { sortModel: sortModel }); }}
                            onFilter={function (filters) { board.handle("filter", { filters: filters }); }}
                            onReorder={function (move) { board.handle("reorder", move); }}
                            onCellEdit={function (edit) { board.handle("cell-edit", edit); }}
                            onActivate={function (event) { board.handle("open", { id: event.node.id }); }}
                        />
                    </div>
                    <div className="pager">
                        <button type="button" disabled={state.list.page <= 1} onClick={function () { board.handle("page", { page: state.list.page - 1 }); }}>
                            <Icon name="left" /> 이전
                        </button>
                        <button type="button" disabled={state.list.page >= state.list.pageCount} onClick={function () { board.handle("page", { page: state.list.page + 1 }); }}>
                            다음
                        </button>
                    </div>
                </div>
            ) : null}
            {state.screen === "detail" && state.post ? (
                <div>
                    <p className="meta">
                        {state.post.author} · {state.post.date}
                    </p>
                    <p>{state.post.tags.join(", ")}</p>
                    <article className="content">{state.post.content}</article>
                    <div className="actions">
                        <button type="button" onClick={function () { board.handle("back", {}); }}>
                            <Icon name="left" /> 목록
                        </button>
                        <button type="button" onClick={function () { board.handle("edit", { id: state.post.id }); }}>
                            <Icon name="pencil" /> 수정
                        </button>
                        <button type="button" onClick={function () { board.handle("delete", { id: state.post.id }); }}>
                            <Icon name="trash" /> 삭제
                        </button>
                    </div>
                </div>
            ) : null}
            {state.screen === "create" || state.screen === "edit" ? (
                <form
                    className="editor"
                    onSubmit={function (event) {
                        event.preventDefault();
                        board.handle("save", { fields: form });
                    }}
                >
                    <label>
                        제목
                        <input value={form.title} onChange={function (event) { setField("title", event.target.value); }} />
                    </label>
                    <label>
                        작성자
                        <input value={form.author} onChange={function (event) { setField("author", event.target.value); }} />
                    </label>
                    <label>
                        날짜
                        <input value={form.date} onChange={function (event) { setField("date", event.target.value); }} />
                    </label>
                    <label>
                        본문
                        <textarea rows={8} value={form.content} onChange={function (event) { setField("content", event.target.value); }} />
                    </label>
                    <label>
                        태그
                        <input value={form.tags} onChange={function (event) { setField("tags", event.target.value); }} />
                    </label>
                    <div className="actions">
                        <button type="button" onClick={function () { board.handle("cancel", {}); }}>
                            <Icon name="left" /> 취소
                        </button>
                        <button type="submit">
                            <Icon name="check" /> 저장
                        </button>
                    </div>
                </form>
            ) : null}
        </div>
    );
}
