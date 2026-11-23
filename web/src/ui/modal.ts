import { popLayer, pushLayer } from "../nav/focus";

import type { ModalLine, ModalOption } from "./types";

/** A menu that is fading out after closing (removed once the fade ends), if any. */
let closing: HTMLElement | undefined = undefined;

/**
 * Shows a centered modal: a title, optional lines of text (plain, or label + value), and a vertical list of options.
 * Choosing an option or pressing Back closes it, and focus returns to where it was.
 * It fades and scales in, and fades out when closed (CSS animations in ui.css; class "closing"). Going straight from one
 * menu to the next (e.g. Dev Menu → Status) skips the backdrop's fade (class "switching"), so the screen behind doesn't
 * flash bright in between; only the new panel animates in.
 */
export function openModal(title: string, options: ModalOption[], lines: ModalLine[] = []): void {
    const switching: boolean = closing !== undefined;
    closing?.remove();
    closing = undefined;

    const overlay: HTMLDivElement = document.createElement("div");
    overlay.className = switching ? "modal-overlay switching" : "modal-overlay";

    const panel: HTMLDivElement = document.createElement("div");
    panel.className = "modal";

    const heading: HTMLHeadingElement = document.createElement("h2");
    heading.className = "modal-title";
    heading.textContent = title;
    panel.append(heading);

    if (lines.length > 0) {
        const text: HTMLDivElement = document.createElement("div");
        text.className = "modal-lines";
        text.append(...lines.map(createLine));
        panel.append(text);
    }

    const close: () => void = (): void => {
        popLayer();
        closing = overlay;
        overlay.classList.add("closing");
        overlay.addEventListener("animationend", (event: AnimationEvent) => {
            if (event.target !== overlay || !overlay.classList.contains("closing")) return;
            overlay.remove();
            if (closing === overlay) closing = undefined;
        });
    };

    const buttons: HTMLButtonElement[] = options.map((option: ModalOption) => {
        const button: HTMLButtonElement = document.createElement("button");
        button.className = "modal-option";
        button.textContent = option.label;
        button.addEventListener("click", () => {
            close();
            option.onSelect();
        });
        return button;
    });
    panel.append(...buttons);

    overlay.append(panel);
    document.body.append(overlay);
    pushLayer(buttons.map((button: HTMLButtonElement) => [button]), close);
}

/** One line of modal text. A label + value line gets the label in its own span, so CSS can dim it and align the values. */
function createLine(line: ModalLine): HTMLParagraphElement {
    const text: HTMLParagraphElement = document.createElement("p");
    text.className = "modal-line";
    if (typeof line === "string") {
        text.textContent = line;
        return text;
    }

    const label: HTMLSpanElement = document.createElement("span");
    label.className = "modal-label";
    label.textContent = line.label;
    text.append(label, line.value);
    return text;
}
