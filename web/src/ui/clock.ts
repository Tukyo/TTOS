import { TIME_MS } from "../config";

/** Hours and minutes in the TV's time zone and language, e.g. "12:41 PM". */
const format = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

/** The top-bar clock. Created once, so every re-render of home reuses the same element and timer. */
export const clock = document.createElement("div");
clock.className = "clock";
tick();

/** Shows the current time, then runs again exactly at the start of the next minute. */
function tick(): void {
    const now = new Date();
    clock.textContent = format.format(now);
    setTimeout(tick, TIME_MS.minute - (now.getSeconds() * TIME_MS.second + now.getMilliseconds()));
}