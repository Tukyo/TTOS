import { WEATHER } from "../config";

import clearIcon from "../assets/icons/weather/clear.svg?raw";
import cloudyIcon from "../assets/icons/weather/cloudy.svg?raw";
import fogIcon from "../assets/icons/weather/fog.svg?raw";
import nightIcon from "../assets/icons/weather/night.svg?raw";
import rainIcon from "../assets/icons/weather/rain.svg?raw";
import snowIcon from "../assets/icons/weather/snow.svg?raw";
import stormIcon from "../assets/icons/weather/storm.svg?raw";

import type { OpenMeteoResponse, WeatherKind } from "./types";

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
void update();
window.setInterval(() => void update(), WEATHER.refreshMs);

/** Fetches the current weather from Open-Meteo and shows it. On any failure (offline, API down) it hides instead of showing old data. */
async function update(): Promise<void> {
    try {
        const url = new URL(WEATHER.apiUrl);
        url.search = new URLSearchParams({
            latitude: String(WEATHER.latitude),
            longitude: String(WEATHER.longitude),
            current: "temperature_2m,weather_code,is_day",
            temperature_unit: WEATHER.temperatureUnit,
        }).toString();

        const response: Response = await fetch(url);
        if (!response.ok) throw new Error(`Open-Meteo answered ${response.status}`);
        const data: OpenMeteoResponse = await response.json();
        const { current } = data;

        const kind: WeatherKind = kindOf(current.weather_code);
        weather.innerHTML = kind === "clear" && current.is_day === 0 ? nightIcon : icons[kind];
        const temperature: HTMLSpanElement = document.createElement("span");
        temperature.textContent = `${Math.round(current.temperature_2m)}°`;
        weather.append(temperature);
        weather.hidden = false;
    } catch {
        weather.hidden = true;
    }
}

/** Groups Open-Meteo's weather codes (the WMO standard: 0 clear … 99 thunderstorm with hail) into the icons TTOS has. */
function kindOf(code: number): WeatherKind {
    if (code <= 1) return "clear";
    if (code === 45 || code === 48) return "fog";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
    if (code >= 95) return "storm";
    return "cloudy";
}