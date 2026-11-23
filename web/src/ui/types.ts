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
        /** An install moved on (Android's confirmation is up, it finished, or the download failed). Called by the Kotlin wrapper; closes the loading modal. */
        ttosInstallStatus?: () => void;
    }
}

/** One choice in a modal. */
export interface ModalOption {
    label: string;
    onSelect: () => void;
    /** Optional heading the option is listed under (e.g. "Installed"); a heading is shown wherever the section changes. */
    section?: string;
}

/** A "label + value" line in a modal (e.g. on the Status screen): the label is shown dimmed in a column, the value bright. */
export interface ModalDetail {
    label: string;
    value: string;
}

/** A line of text in a modal: plain text, or a label + value. */
export type ModalLine = string | ModalDetail;

/** One hue slice: total vote weight and the weighted sum of its pixels' colors. */
export interface Bucket {
    weight: number;
    r: number;
    g: number;
    b: number;
}

/** Hue, saturation, lightness, each 0–1. */
export interface Hsl {
    h: number;
    s: number;
    l: number;
}

/** An app's two background glows as CSS colors: top left (its color) and bottom right (a darker, fainter shade of it). */
export interface Glow {
    primary: string;
    shade: string;
}

/** What the weather icon shows. The NWS icon's condition codes are grouped into these in ui/weather.ts. */
export type WeatherKind = "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";

/** The part of the National Weather Service's latest observation TTOS reads (api.weather.gov/stations/…/observations/latest). */
export interface NwsObservation {
    properties: {
        /** e.g. "https://api.weather.gov/icons/land/night/bkn?size=medium": day or night, then the condition code (bkn = mostly cloudy). */
        icon: string | null;
        /** Air temperature in °C; null when the station didn't report one. */
        temperature: { value: number | null };
    };
}

/** One APK in the dev server's drop folder, as listed at dev.apks.path (vite.config.ts). */
export interface ApkFile {
    /** File name, e.g. "SmartTube.apk". */
    name: string;
    /** Size in bytes. */
    size: number;
    /** When it was last changed (ms since 1970), so the newest drops list first. */
    modified: number;
    /** The app's package name, e.g. "com.teamsmart.videomanager.tv" (read by aapt2; empty if it couldn't be read). */
    packageName: string;
    /** The app's name, e.g. "SmartTube" (the file name if it couldn't be read). */
    label: string;
    /** The human version, e.g. "31.02". */
    versionName: string;
    /** Android's version number, compared with the installed one to offer an update. */
    versionCode: number;
}