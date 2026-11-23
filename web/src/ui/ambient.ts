import { AMBIENT } from "../config";

import type { Bucket, Glow, Hsl } from "./types";

/** Each banner's glow colors (null = no real color, keep the default glows). Computed once per banner, on first focus. */
const colors = new Map<string, Promise<Glow | null>>();

/** The banner the latest showAmbient() was for, so a slow computation can't overwrite a newer one. */
let latest: string | undefined = undefined;

/** Waits for focus to settle (AMBIENT.settleMs) before anything is sampled or swapped. */
let settleTimer: number | undefined = undefined;

/** Which glow layer is showing: "a" = html::before, "b" = html::after (see root.css). */
let shown: "a" | "b" = "a";

/** The glow the showing layer has (null = the default glows), so focusing the same color again does nothing. */
let current: Glow | null = null;

/**
 * Fades the background glow toward `bannerUrl`'s dominant color, or back to the default glow (no banner, or no real color),
 * once focus has rested for AMBIENT.settleMs. Each call restarts the wait, so scrolling through tiles changes nothing.
 */
export function showAmbient(bannerUrl: string | undefined): void {
    latest = bannerUrl;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => applyAmbient(bannerUrl), AMBIENT.settleMs);
}

/** Samples (or reuses the cached) glow of `bannerUrl` and shows it, unless focus has moved on meanwhile. */
function applyAmbient(bannerUrl: string | undefined): void {
    if (!bannerUrl) {
        setGlow(null);
        return;
    }

    let glow: Promise<Glow | null> | undefined = colors.get(bannerUrl);
    if (!glow) {
        glow = dominantColor(bannerUrl);
        colors.set(bannerUrl, glow);
    }
    void glow.then((value: Glow | null) => {
        if (latest === bannerUrl) setGlow(value);
    });
}

/**
 * Puts `glow` (null = the default glows from root.css) on the hidden layer, then flips data-glow on html,
 * so CSS crossfades the two layers by opacity.
 */
function setGlow(glow: Glow | null): void {
    if ((glow?.primary ?? null) === (current?.primary ?? null)) return;
    const next: "a" | "b" = shown === "a" ? "b" : "a";
    const root: HTMLElement = document.documentElement;
    if (glow) {
        root.style.setProperty(`--glow-${next}`, glow.primary);
        root.style.setProperty(`--glow-${next}-shade`, glow.shade);
    } else {
        root.style.removeProperty(`--glow-${next}`);
        root.style.removeProperty(`--glow-${next}-shade`);
    }
    root.dataset.glow = next;
    shown = next;
    current = glow;
}

/**
 * The banner's two glow colors (hsl() strings), or null if it has no real color.
 * Shrinks the banner, ignores colorless pixels (too dark, bright or grey), lets the rest vote for a hue slice (weighted by
 * saturation), averages the winning slice's real pixels, then sets fixed lightness and strength per glow (AMBIENT.glow* / shade*).
 */
async function dominantColor(url: string): Promise<Glow | null> {
    try {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = url;
        await image.decode();

        const canvas: HTMLCanvasElement = document.createElement("canvas");
        canvas.width = AMBIENT.sampleWidth;
        canvas.height = AMBIENT.sampleHeight;
        const context: CanvasRenderingContext2D | null = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return null;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels: Uint8ClampedArray = context.getImageData(0, 0, canvas.width, canvas.height).data;

        const buckets: Bucket[] = Array.from({ length: AMBIENT.hueBuckets }, () => ({ weight: 0, r: 0, g: 0, b: 0 }));
        let colorful: number = 0;
        for (let i: number = 0; i < pixels.length; i += 4) {
            const r: number = (pixels[i] ?? 0) / 255;
            const g: number = (pixels[i + 1] ?? 0) / 255;
            const b: number = (pixels[i + 2] ?? 0) / 255;
            const alpha: number = (pixels[i + 3] ?? 0) / 255;
            const { h, s, l }: Hsl = toHsl(r, g, b);
            if (alpha === 0 || l < AMBIENT.minLightness || l > AMBIENT.maxLightness || s < AMBIENT.minSaturation) continue;

            colorful++;
            const bucket: Bucket | undefined = buckets[Math.floor(h * AMBIENT.hueBuckets) % AMBIENT.hueBuckets];
            if (!bucket) continue;
            const weight: number = s * alpha;
            bucket.weight += weight;
            bucket.r += r * weight;
            bucket.g += g * weight;
            bucket.b += b * weight;
        }

        const pixelCount: number = pixels.length / 4;
        if (colorful < AMBIENT.minColorfulShare * pixelCount) return null;

        const best: Bucket = buckets.reduce((a: Bucket, b: Bucket) => (b.weight > a.weight ? b : a));
        const { h, s }: Hsl = toHsl(best.r / best.weight, best.g / best.weight, best.b / best.weight);
        return {
            primary: `hsl(${h * 360} ${s * 100}% ${AMBIENT.glowLightness * 100}% / ${AMBIENT.glowAlpha})`,
            shade: `hsl(${h * 360} ${s * 100}% ${AMBIENT.shadeLightness * 100}% / ${AMBIENT.shadeAlpha})`,
        };
    } catch {
        return null;
    }
}

/** Standard RGB → HSL conversion (all values 0–1). */
function toHsl(r: number, g: number, b: number): Hsl {
    const max: number = Math.max(r, g, b);
    const min: number = Math.min(r, g, b);
    const l: number = (max + min) / 2;
    const d: number = max - min;
    if (d === 0) return { h: 0, s: 0, l };

    const s: number = d / (1 - Math.abs(2 * l - 1));
    let h: number;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return { h: ((h / 6) % 1 + 1) % 1, s, l };
}