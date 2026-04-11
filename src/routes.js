import { createBrowserRouter } from "react-router";
import JoinCreateChat from "./Pages/JoinCreateChat";
import ChatPage from "./Pages/ChatPage/ChatPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <JoinCreateChat />,
  },
  {
    path: "/room",
    element: <ChatPage />,
  }
]);