import { popLayer, pushLayer } from "../nav/focus";

import type { ModalLine, ModalOption } from "./types";

/**
 * Shows a centered modal: a title, optional lines of text (plain, or label + value), and a vertical list of options.
 * Choosing an option or pressing Back closes it, and focus returns to where it was.
 */
export function openModal(title: string, options: ModalOption[], lines: ModalLine[] = []): void {
    const overlay: HTMLDivElement = document.createElement("div");
    overlay.className = "modal-overlay";

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
        overlay.remove();
        popLayer();
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