/*
 * 게시판 규칙이다. React 컴포넌트가 아니다.
 * 검색, 쪽 나눔, 검사, 등록, 수정, 삭제를 순수 함수로 둔다.
 * 자식 글은 children이다. 쪽은 루트만 세고, 그리드가 트리를 편다.
 * 화면 상태는 useBoard의 useState가 가진다.
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
        children: Array.isArray(source.children) ? source.children.map(normalize) : [],
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
        children: (post.children || []).map(stored),
    };
}

export function findPost(posts, id) {
    var found = null;
    (posts || []).some(function (post) {
        if (post.id === id) {
            found = post;
            return true;
        }
        found = findPost(post.children, id);
        return !!found;
    });
    return found;
}

function maxId(posts) {
    return (posts || []).reduce(function (highest, post) {
        var number = parseInt(String(post.id).replace(/\D/g, ""), 10);
        var next = Number.isFinite(number) ? Math.max(highest, number) : highest;
        return Math.max(next, maxId(post.children));
    }, 0);
}

function nextId(posts) {
    return "p" + String(maxId(posts) + 1).padStart(2, "0");
}

function textOf(post) {
    return [post.title, post.author, post.content, (post.tags || []).join(" ")].join(" ").toLowerCase();
}

function keepMatch(post, needle) {
    if (!needle) return stored(post);
    var children = (post.children || []).map(function (child) {
        return keepMatch(child, needle);
    }).filter(Boolean);
    if (textOf(post).indexOf(needle) !== -1) return stored(post);
    if (!children.length) return null;
    var copy = stored(post);
    copy.children = children;
    return copy;
}

function comparePosts(left, right, sortModel) {
    var model = sortModel && sortModel.length ? sortModel : [{ dataIndex: "date", sort: "desc" }];
    for (var index = 0; index < model.length; index += 1) {
        var key = model[index].dataIndex === "tree" ? "title" : model[index].dataIndex;
        var lv = key === "tags" ? (left.tags || []).join(", ") : String(left[key] || "");
        var rv = key === "tags" ? (right.tags || []).join(", ") : String(right[key] || "");
        if (lv === rv) continue;
        var order = lv < rv ? -1 : 1;
        return model[index].sort === "desc" ? -order : order;
    }
    return 0;
}

function sortPosts(posts, sortModel) {
    return (posts || []).map(function (post) {
        var copy = stored(post);
        copy.children = sortPosts(copy.children, sortModel);
        return copy;
    }).sort(function (left, right) {
        return comparePosts(left, right, sortModel);
    });
}

function replacePost(posts, id, mapper) {
    var found = false;
    var next = (posts || []).map(function (post) {
        if (post.id === id) {
            found = true;
            return mapper(post);
        }
        var below = replacePost(post.children, id, mapper);
        if (!below.found) return post;
        found = true;
        var copy = stored(post);
        copy.children = below.posts;
        return copy;
    });
    return { found: found, posts: next };
}

export function pageOf(posts, page, pageSize, query, sortModel) {
    var size = pageSize > 0 ? pageSize : PAGE_SIZE;
    var needle = String(query || "").trim().toLowerCase();
    var matched = (posts || []).map(function (post) {
        return keepMatch(post, needle);
    }).filter(Boolean);
    matched = sortPosts(matched, sortModel);
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
    var current = findPost(posts, id);
    if (!current) return { ok: false, errors: ["글을 찾지 못했습니다."] };
    var post = normalize(raw);
    post.id = id;
    post.children = current.children || [];
    var errors = validate(post);
    if (errors.length) return { ok: false, errors: errors, post: post };
    var saved = stored(post);
    var replaced = replacePost(posts, id, function () {
        return saved;
    });
    return { ok: true, posts: replaced.posts, post: saved };
}

function withoutPost(posts, id) {
    var found = false;
    var next = [];
    (posts || []).forEach(function (post) {
        if (post.id === id) {
            found = true;
            return;
        }
        var copy = stored(post);
        var below = withoutPost(copy.children, id);
        if (below.found) {
            found = true;
            copy.children = below.posts;
        }
        next.push(copy);
    });
    return { found: found, posts: next };
}

export function deletePost(posts, id) {
    var removed = withoutPost(posts, id);
    if (!removed.found) return { ok: false, errors: ["글을 찾지 못했습니다."] };
    return { ok: true, posts: removed.posts };
}
