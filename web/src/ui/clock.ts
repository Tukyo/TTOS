import { TIME_MS } from "../config";

/** Hours and minutes in the TV's time zone and language, e.g. "12:41 PM". */
const format = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

/** Short weekday and date in the TV's language, e.g. "Sun, Nov 22". */
const dateFormat = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" });

/** The top-bar clock. Created once, so every re-render of home reuses the same element and timer. */
export const clock = document.createElement("div");
clock.className = "clock";
tick();

/** Shows the current time (AM/PM in its own span, styled smaller by CSS) and the date, then runs again exactly at the start of the next minute. */
function tick(): void {
    const now = new Date();
    const parts: Intl.DateTimeFormatPart[] = format.formatToParts(now);
    const time: string = parts.filter((part: Intl.DateTimeFormatPart) => part.type !== "dayPeriod").map((part: Intl.DateTimeFormatPart) => part.value).join("").trim();
    const period: string | undefined = parts.find((part: Intl.DateTimeFormatPart) => part.type === "dayPeriod")?.value;

    clock.replaceChildren(time);
    if (period) {
        const periodSpan: HTMLSpanElement = document.createElement("span");
        periodSpan.className = "clock-period";
        periodSpan.textContent = period;
        clock.append(periodSpan);
    }

    const dateSpan: HTMLSpanElement = document.createElement("span");
    dateSpan.className = "clock-date";
    dateSpan.textContent = dateFormat.format(now);
    clock.append(dateSpan);

    setTimeout(tick, TIME_MS.minute - (now.getSeconds() * TIME_MS.second + now.getMilliseconds()));
}