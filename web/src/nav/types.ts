/** Remote buttons that TTOS's accessibility service catches and passes to the UI. */
export type RemoteButton = "star" | "youtube" | "netflix";

/** What a key the page receives directly means (the values of remote.keyActions in ttos.config.json). */
export type KeyAction = "up" | "down" | "left" | "right" | "select";

/** What a remote or keyboard press means to the UI. OK arrives as press + release (selectDown / selectUp), so a hold can be told apart from a click. */
export type Action = "up" | "down" | "left" | "right" | "selectDown" | "selectUp" | "back" | "home" | RemoteButton;

declare global {
    interface Window {
        /** Called by the Kotlin wrapper when the remote's Back button is pressed. */
        ttosBack?: () => void;
        /** Called by the Kotlin wrapper when Home is pressed while TTOS is already on screen. */
        ttosHome?: () => void;
        /** Called by the Kotlin wrapper when Star, YouTube or Netflix is pressed (caught by TTOSButtonService). */
        ttosButton?: (button: RemoteButton) => void;
    }
}