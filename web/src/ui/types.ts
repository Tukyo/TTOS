/** One choice in a modal. */
export interface ModalOption {
    label: string;
    onSelect: () => void;
}

declare global {
    interface Window {
        /** Opens the hidden dev menu. Called by the Kotlin wrapper when the Konami code is entered. */
        ttosDevMenu?: () => void;
        /** Re-draws the home screen. Called by the Kotlin wrapper when TTOS comes back on screen and when an app is installed, removed or updated. */
        ttosRefresh?: () => void;
        /** Re-reads the network status. Called by the Kotlin wrapper whenever the internet connection appears, changes or drops. */
        ttosNetwork?: () => void;
        /** Shows the "Installing update" modal. Called by the Kotlin wrapper right before a self-update installs. */
        ttosUpdating?: () => void;
    }
}