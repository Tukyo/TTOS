import "./styles/root.css";
import "./styles/ui.css";
import { handle } from "./nav/focus";
import { onAction } from "./nav/keys";
import { renderHome } from "./ui/home";

const root = document.getElementById("app");
if (!root) throw new Error("#app is missing from index.html");

renderHome(root);
onAction(handle);