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

/** One choice in a modal. */
export interface ModalOption {
    label: string;
    onSelect: () => void;
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

/** What the weather icon shows. Open-Meteo's weather codes (the WMO standard) are grouped into these in ui/weather.ts. */
export type WeatherKind = "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";

/** The part of Open-Meteo's forecast response TTOS asks for (current=temperature_2m,weather_code,is_day). */
export interface OpenMeteoResponse {
    current: {
        /** Air temperature in the configured unit. */
        temperature_2m: number;
        /** WMO weather code, e.g. 0 = clear sky, 61 = light rain, 95 = thunderstorm. */
        weather_code: number;
        /** 1 during daylight, 0 at night (so a clear night shows a moon, not a sun). */
        is_day: number;
    };
}