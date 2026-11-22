import { AMBIENT } from "../config";

/** Each banner's ambient color (null = no real color, keep the default glow). Computed once per banner, on first focus. */
const colors = new Map<string, Promise<string | null>>();

/** The banner the latest showAmbient() was for, so a slow computation can't overwrite a newer one. */
let latest: string | undefined = undefined;

/** Fades the background glow toward `bannerUrl`'s dominant color, or back to the default glow (no banner, or no real color). */
export function showAmbient(bannerUrl: string | undefined): void {
    latest = bannerUrl;
    if (!bannerUrl) {
        setGlow(null);
        return;
    }

    let color: Promise<string | null> | undefined = colors.get(bannerUrl);
    if (!color) {
        color = dominantColor(bannerUrl);
        colors.set(bannerUrl, color);
    }
    void color.then((value: string | null) => {
        if (latest === bannerUrl) setGlow(value);
    });
}

/** Which glow layer is showing: "a" = body::before, "b" = body::after (see root.css). */
let shown: "a" | "b" = "a";

/** The color the showing layer has (null = the default glow), so focusing the same color again does nothing. */
let current: string | null = null;

/**
 * Puts `color` (null = the default glow from root.css) on the hidden layer, then flips data-glow on body,
 * so CSS crossfades the two layers by opacity.
 */
function setGlow(color: string | null): void {
    if (color === current) return;
    const next: "a" | "b" = shown === "a" ? "b" : "a";
    if (color) document.body.style.setProperty(`--glow-${next}`, color);
    else document.body.style.removeProperty(`--glow-${next}`);
    document.body.dataset.glow = next;
    shown = next;
    current = color;
}

/**
 * The banner's dominant color as an hsl() string, or null if it has none.
 * Shrinks the banner, ignores colorless pixels (too dark, bright or grey), lets the rest vote for a hue slice (weighted by
 * saturation), averages the winning slice's real pixels, then sets a fixed lightness and strength (AMBIENT.glow*).
 */
async function dominantColor(url: string): Promise<string | null> {
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
        return `hsl(${h * 360} ${s * 100}% ${AMBIENT.glowLightness * 100}% / ${AMBIENT.glowAlpha})`;
    } catch {
        return null;
    }
}

/** One hue slice: total vote weight and the weighted sum of its pixels' colors. */
interface Bucket {
    weight: number;
    r: number;
    g: number;
    b: number;
}

/** Hue, saturation, lightness, each 0–1. */
interface Hsl {
    h: number;
    s: number;
    l: number;
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