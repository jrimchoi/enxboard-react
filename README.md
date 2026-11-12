# ENXBoardReact

같은 게시판의 React 18 화면이다. JSX 번들러가 없어서 `React.createElement`로 트리를 만든다. 글 저장과 명령은 `vendor/enxboard`의 AMD 모듈을 그대로 쓴다.

React는 `createRoot().render`로 다시 그린다. 입력은 `defaultValue`라서, 저장 전에 다시 그려도 치는 중인 글자가 컨트롤러 상태로 올라가기 전에 지워지지 않는다.

## StackBlitz

https://stackblitz.com/fork/github/jrimchoi/enxboard-react

## 로컬

```text
npm install
npm run dev
```

| 주소 | 화면 |
|---|---|
| `/` | 게시판 |
| `/mock-shell.html` | 대시보드 목 셸. 검색어를 위젯 값에 남긴다 |

## 구성

| 경로 | 역할 |
|---|---|
| `js/view.js` | React 18 화면 |
| `js/app.js` | `createRoot`와 공유 컨트롤러를 연결 |
| `js/loader.js` | AMD 로더. React UMD의 익명 `define`을 한 파일씩 받는다 |
| `vendor/react`, `vendor/react-dom` | React 18.2.0 |
| `vendor/enxboard` | 글 모델, 목록, 저장, 명령 컨트롤러, 위젯 연결, 스타일, 목 데이터 |
| `vendor/core` | 아이콘 CSS와 글꼴 |
