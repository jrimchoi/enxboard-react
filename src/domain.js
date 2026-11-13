/*
 * 게시판 규칙이다. React 컴포넌트가 아니다.
 * 검색, 쪽 나눔, 검사, 등록, 수정, 삭제를 순수 함수로 둔다.
 * 화면 상태는 useBoard의 useState가 가진다.
 * Vue 앱은 reactive, Next 앱은 pages의 useState가 같은 규칙을 각자 구현한다.
 */
export const PAGE_SIZE = 5;

export function normalize(raw) {
    var source = raw || {};
    var tags = Array.isArray(source.tags) ? source.tags : String(source.tags || "").split(",");
    return {
        id: source.id || "",
        title: source.title == null ? "" : String(source.title),
        author: source.author == null ? "" : String(source.author),
        date: source.date == null ? "" : String(source.date),
        content: source.content == null ? "" : String(source.content),
        tags: tags
            .map(function (tag) {
                return String(tag).trim();
            })
            .filter(Boolean),
    };
}

export function validate(post) {
    var errors = [];
    if (!String(post.title).trim()) errors.push("제목을 입력하세요.");
    if (!String(post.author).trim()) errors.push("작성자를 입력하세요.");
    if (!String(post.content).trim()) errors.push("본문을 입력하세요.");
    if (post.date && !/^\d{4}-\d{2}-\d{2}$/.test(post.date)) errors.push("날짜는 YYYY-MM-DD 형식입니다.");
    return errors;
}

export function stored(post) {
    return {
        id: post.id,
        title: String(post.title).trim(),
        author: String(post.author).trim(),
        date: post.date,
        content: String(post.content).trim(),
        tags: post.tags.slice(),
    };
}

function nextId(posts) {
    var max = posts.reduce(function (highest, post) {
        var number = parseInt(String(post.id).replace(/\D/g, ""), 10);
        return Number.isFinite(number) ? Math.max(highest, number) : highest;
    }, 0);
    return "p" + String(max + 1).padStart(2, "0");
}

export function pageOf(posts, page, pageSize, query) {
    var size = pageSize > 0 ? pageSize : PAGE_SIZE;
    var needle = String(query || "").trim().toLowerCase();
    var matched = posts.filter(function (post) {
        if (!needle) return true;
        var haystack = [post.title, post.author, post.content, post.tags.join(" ")].join(" ").toLowerCase();
        return haystack.indexOf(needle) !== -1;
    });
    matched.sort(function (left, right) {
        if (left.date === right.date) return right.id < left.id ? -1 : 1;
        return right.date < left.date ? -1 : 1;
    });
    var total = matched.length;
    var pageCount = Math.max(1, Math.ceil(total / size));
    var current = Math.min(Math.max(page || 1, 1), pageCount);
    var start = (current - 1) * size;
    return {
        items: matched.slice(start, start + size).map(function (post) {
            return stored(post);
        }),
        page: current,
        pageSize: size,
        total: total,
        pageCount: pageCount,
    };
}

export function createPost(posts, raw) {
    var post = normalize(raw);
    var errors = validate(post);
    if (errors.length) return { ok: false, errors: errors, post: post };
    post.id = nextId(posts);
    if (!post.date) post.date = new Date().toISOString().slice(0, 10);
    var saved = stored(post);
    return { ok: true, posts: posts.concat(saved), post: saved };
}

export function updatePost(posts, id, raw) {
    var index = posts.findIndex(function (post) {
        return post.id === id;
    });
    if (index < 0) return { ok: false, errors: ["글을 찾지 못했습니다."] };
    var post = normalize(raw);
    post.id = id;
    var errors = validate(post);
    if (errors.length) return { ok: false, errors: errors, post: post };
    var saved = stored(post);
    var next = posts.slice();
    next[index] = saved;
    return { ok: true, posts: next, post: saved };
}

export function deletePost(posts, id) {
    var next = posts.filter(function (post) {
        return post.id !== id;
    });
    if (next.length === posts.length) return { ok: false, errors: ["글을 찾지 못했습니다."] };
    return { ok: true, posts: next };
}
