import { popLayer, pushLayer } from "../nav/focus";
import { createLoader } from "./loader";

import type { ModalLine, ModalOption } from "./types";

/** A menu that is fading out after closing (removed once the fade ends), if any. */
let closing: HTMLElement | undefined = undefined;

/**
 * Shows a centered modal: a title, optional lines of text (plain, or label + value), optional extra content (e.g. a
 * loader), and a vertical list of options, grouped under headings where an option has a `section`.
 * Choosing an option or pressing Back closes it, and focus returns to where it was. Returns a function that closes it from
 * code (does nothing if it's already closed).
 * It fades and scales in, and fades out when closed (CSS animations in ui.css; class "closing"). Going straight from one
 * menu to the next (e.g. Dev Menu → Status) skips the backdrop's fade (class "switching"), so the screen behind doesn't
 * flash bright in between; only the new panel animates in.
 */
export function openModal(title: string, options: ModalOption[], lines: ModalLine[] = [], content?: HTMLElement): () => void {
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
    if (content) panel.append(content);

    let open: boolean = true;
    const close: () => void = (): void => {
        if (!open) return;
        open = false;
        popLayer();
        closing = overlay;
        overlay.classList.add("closing");
        overlay.addEventListener("animationend", (event: AnimationEvent) => {
            if (event.target !== overlay || !overlay.classList.contains("closing")) return;
            overlay.remove();
            if (closing === overlay) closing = undefined;
        });
    };

    let section: string | undefined = undefined;
    const buttons: HTMLButtonElement[] = options.map((option: ModalOption) => {
        if (option.section !== undefined && option.section !== section) {
            const sectionHeading: HTMLParagraphElement = document.createElement("p");
            sectionHeading.className = "modal-section";
            sectionHeading.textContent = option.section;
            panel.append(sectionHeading);
        } else if (option.section === undefined && section !== undefined) {
            // Options after the sectioned list (e.g. "Back to menu") get a divider, so they don't read as part of the last section.
            const divider: HTMLHRElement = document.createElement("hr");
            divider.className = "modal-divider";
            panel.append(divider);
        }
        section = option.section;

        const button: HTMLButtonElement = document.createElement("button");
        button.className = "modal-option";
        button.textContent = option.label;
        button.addEventListener("click", () => {
            close();
            option.onSelect();
        });
        panel.append(button);
        return button;
    });

    overlay.append(panel);
    document.body.append(overlay);
    pushLayer(buttons.map((button: HTMLButtonElement) => [button]), close);
    return close;
}

/**
 * A modal for something that takes a moment (a download, an update): the title, optional lines, a spinning loader and a
 * Hide button (the work carries on in the background). Returns the function that closes it when the work moves on.
 */
export function openLoading(title: string, lines: ModalLine[] = []): () => void {
    return openModal(title, [{ label: "Hide", onSelect: () => { } }], lines, createLoader());
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
