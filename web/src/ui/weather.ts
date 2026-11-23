import { WEATHER } from "../config";

import clearIcon from "../assets/icons/weather/clear.svg?raw";
import cloudyIcon from "../assets/icons/weather/cloudy.svg?raw";
import fogIcon from "../assets/icons/weather/fog.svg?raw";
import nightIcon from "../assets/icons/weather/night.svg?raw";
import rainIcon from "../assets/icons/weather/rain.svg?raw";
import snowIcon from "../assets/icons/weather/snow.svg?raw";
import stormIcon from "../assets/icons/weather/storm.svg?raw";

import type { NwsObservation, WeatherKind } from "./types";

/** Each kind of weather's icon. A clear night uses nightIcon instead (see update()). */
const icons: Record<WeatherKind, string> = {
    clear: clearIcon,
    cloudy: cloudyIcon,
    fog: fogIcon,
    rain: rainIcon,
    snow: snowIcon,
    storm: stormIcon,
};

/** The top-bar weather: icon + temperature. Created once (like the clock), so every re-render of home reuses it. Hidden until a fetch works. */
export const weather = document.createElement("div");
weather.className = "weather";
weather.hidden = true;

/** The next scheduled fetch. */
let nextUpdate: number | undefined = undefined;

void update();

/**
 * Fetches the latest observation from the NWS station and shows it. On any failure (offline, slow or missing answer, no
 * current reading) it hides instead of showing old data and tries again after WEATHER.retryMs; after a success, the next
 * fetch is WEATHER.refreshMs later. A hanging request gives up after WEATHER.timeoutMs.
 */
async function update(): Promise<void> {
    let worked: boolean = false;
    try {
        const response: Response = await fetch(`${WEATHER.apiUrl}/${WEATHER.station}/observations/latest`, {
            signal: AbortSignal.timeout(WEATHER.timeoutMs),
        });
        if (!response.ok) throw new Error(`api.weather.gov answered ${response.status}`);
        const { properties }: NwsObservation = await response.json();
        const celsius: number | null = properties.temperature.value;
        if (celsius === null || !properties.icon) throw new Error("The station has no current reading");

        const kind: WeatherKind = kindOf(conditionOf(properties.icon));
        const night: boolean = new URL(properties.icon).pathname.split("/").includes("night");
        weather.innerHTML = kind === "clear" && night ? nightIcon : icons[kind];
        const temperature: HTMLSpanElement = document.createElement("span");
        temperature.textContent = `${Math.round(WEATHER.temperatureUnit === "fahrenheit" ? celsius * 9 / 5 + 32 : celsius)}°`;
        weather.append(temperature);
        weather.hidden = false;
        worked = true;
    } catch {
        weather.hidden = true;
    }
    window.clearTimeout(nextUpdate);
    nextUpdate = window.setTimeout(() => void update(), worked ? WEATHER.refreshMs : WEATHER.retryMs);
}

/** The condition code in an NWS icon URL: "bkn" from ".../icons/land/night/bkn?size=medium" ("rain,40" → "rain"; of two, the first). */
function conditionOf(icon: string): string {
    const parts: string[] = new URL(icon).pathname.split("/");
    const time: number = parts.findIndex((part: string) => part === "day" || part === "night");
    return (parts[time + 1] ?? "").split(",")[0] ?? "";
}

/**
 * Groups NWS condition codes (https://api.weather.gov/icons) into the icons TTOS has: skc / few = clear or a few clouds,
 * sct / bkn / ovc = partly to fully cloudy, rain*, fzra / sleet = rain, snow* / blizzard = snow, tsra* / tornado /
 * hurricane / tropical_storm = storm, fog = fog. Anything else (haze, smoke, dust, wind_bkn…) shows as cloudy.
 */
function kindOf(condition: string): WeatherKind {
    if (/^(tsra|tornado|hurricane|tropical_storm)/.test(condition)) return "storm";
    if (/snow|blizzard/.test(condition)) return "snow";
    if (/rain|fzra|sleet/.test(condition)) return "rain";
    if (condition === "fog") return "fog";
    if (/^(wind_)?(skc|few)$|^(hot|cold)$/.test(condition)) return "clear";
    return "cloudy";
}
