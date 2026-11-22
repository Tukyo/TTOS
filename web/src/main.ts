import "./styles/root.css";
import "./styles/ui.css";

import { handle } from "./nav/focus";
import { onAction } from "./nav/keys";
import { renderHome } from "./ui/home";
import { openDevMenu } from "./ui/devmenu";
import { openModal } from "./ui/modal";

const root = document.getElementById("app");
if (!root) throw new Error("#app is missing from index.html");

renderHome(root);
onAction(handle);

window.ttosDevMenu = openDevMenu;

window.ttosRefresh = () => {
    handle("home");
    renderHome(root);
};

window.ttosUpdating = () => {
    handle("home");
    openModal("Installing update…", [{ label: "Dismiss", onSelect: () => { } }], ["Please wait, TTOS will restart."]);
};