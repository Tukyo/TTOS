import { popLayer, pushLayer } from "../nav/focus";
import type { ModalOption } from "./types";

/**
 * Shows a centered modal: a title, optional lines of text, and a vertical list of options.
 * Choosing an option or pressing Back closes it, and focus returns to where it was.
 */
export function openModal(title: string, options: ModalOption[], lines: string[] = []): void {
    const overlay: HTMLDivElement = document.createElement("div");
    overlay.className = "modal-overlay";

    const panel: HTMLDivElement = document.createElement("div");
    panel.className = "modal";

    const heading: HTMLHeadingElement = document.createElement("h2");
    heading.className = "modal-title";
    heading.textContent = title;
    panel.append(heading);

    lines.forEach((line: string) => {
        const text: HTMLParagraphElement = document.createElement("p");
        text.className = "modal-line";
        text.textContent = line;
        panel.append(text);
    });

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