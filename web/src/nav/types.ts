/** Remote buttons that TTOS's accessibility service catches and passes to the UI. */
export type RemoteButton = "star" | "youtube" | "netflix";

/** What a remote or keyboard press means to the UI. */
export type Action = "up" | "down" | "left" | "right" | "select" | "back" | "home" | RemoteButton;

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