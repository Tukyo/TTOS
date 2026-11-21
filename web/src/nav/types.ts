/** What a remote or keyboard press means to the UI. */
export type Action = "up" | "down" | "left" | "right" | "select" | "back";

declare global {
    interface Window {
        /** Called by the Kotlin wrapper when the remote's Back button is pressed. */
        ttosBack?: () => void;
    }
}