# ENXBoardReact

같은 게시판을 React 18 앱으로 만든 것이다. JSX와 `useState`를 쓰고, AMD 모듈은 없다.

화면은 `src/Board.jsx`다. 목록은 `src/grid/DataGrid.jsx`다. 트리 접기, 열 정렬, 행 선택은 `src/grid/model.js`가 계산한다. 이 모델 파일은 Vue, Next와 같고 화면만 React다. 상세, 등록, 수정, 삭제, 검색, 5건 쪽 나눔은 `src/useBoard.js`가 상태로 가진다. 검사와 정렬은 `src/domain.js`의 함수다. 글은 `public/data/posts.json`을 읽어 메모리에만 둔다. 아이콘 글꼴은 `public/core`에 있다.

## StackBlitz

https://stackblitz.com/fork/github/jrimchoi/enxboard-react

Vite 개발 서버가 열리고 미리보기는 `/`다.

## 로컬

```text
npm install
npm run dev
```

| 주소 | 화면 |
|---|---|
| `/` | 게시판 |
| `/mock-shell.html` | 대시보드 목 셸 |

## 구성

| 경로 | 역할 |
|---|---|
| `src/main.jsx` | `createRoot` |
| `src/Board.jsx` | JSX 화면과 입력 |
| `src/useBoard.js` | 화면 상태. React `useState` |
| `src/domain.js` | 검색, 쪽, 검사, 저장 |
| `src/widget.js` | 목 셸의 위젯 이벤트 |
| `src/styles/board.css` | 화면 골격 |
