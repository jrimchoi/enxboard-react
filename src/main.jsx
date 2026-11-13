/*
 * React 18 앱의 진입이다. createRoot가 Board를 #board에 그린다.
 * JSX는 Vite가 컴파일한다. AMD define/require는 쓰지 않는다.
 * Vue는 createApp, Next는 pages/index.js가 이 역할이다.
 */
import { createRoot } from "react-dom/client";
import Board from "./Board";
import "./styles/board.css";

createRoot(document.getElementById("board")).render(<Board />);
