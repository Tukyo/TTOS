import "./styles/root.css";
import "./styles/ui.css";

import { handle } from "./nav/focus";
import { onAction } from "./nav/keys";
import { renderHome } from "./ui/home";
import { onInstallStatus, onUpdateResult, openDevMenu } from "./ui/devmenu";
import { openLoading } from "./ui/modal";
import { updateNetwork } from "./ui/network";

const root = document.getElementById("app");
if (!root) throw new Error("#app is missing from index.html");

renderHome(root);
onAction(handle);

window.ttosDevMenu = openDevMenu;
window.ttosNetwork = updateNetwork;

window.ttosRefresh = () => {
    handle("home");
    renderHome(root);
};

window.ttosUpdating = () => {
    handle("home");
    openLoading("Installing update", ["Please wait, TTOS will restart."]);
};

window.ttosInstallStatus = onInstallStatus;
window.ttosUpdateResult = onUpdateResult;
