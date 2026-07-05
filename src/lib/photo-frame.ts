// ============================================================
// Progress-photo compositor — privacy-first, fully on-device.
// Draws the user's photo into template.png's placeholder and
// renders the caption strip from live app data (date · time ·
// day · weight). Nothing ever leaves the browser.
// ============================================================

const TEMPLATE_SRC = "/template.png";

/** measured placeholder geometry of template.png (1024×1536) */
const T = {
  w: 1024,
  h: 1536,
  ph: { x: 69, y: 76, w: 951 - 69, h: 1409 - 76 },
  captionY: 1468,
  captionClearTop: 1424,
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that image"));
    };
    img.src = url;
  });
}

/** cover-crop: fill the target rect, cropping overflow, centered */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export interface FrameData {
  date?: Date;
  weightKg?: number;
}

export interface FramedPhoto {
  blob: Blob;
  /** compact framed thumbnail for the in-app comparison slider */
  thumbDataUrl: string;
  fileName: string;
  capturedAt: string;
}

export async function generateFramedPhoto(
  file: File,
  angle: string,
  data: FrameData = {},
): Promise<FramedPhoto> {
  const when = data.date ?? new Date();
  const [template, photo] = await Promise.all([loadImage(TEMPLATE_SRC), fileToImage(file)]);

  // render at 2× template resolution for crisp output
  const S = 2;
  const W = T.w * S;
  const H = T.h * S;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(template, 0, 0, W, H);
  drawCover(ctx, photo, T.ph.x * S, T.ph.y * S, T.ph.w * S, T.ph.h * S);

  // clear the placeholder caption and draw live data in its style
  ctx.fillStyle = "#fefefe";
  ctx.fillRect(0, T.captionClearTop * S, W, (T.h - T.captionClearTop) * S);

  const dd = String(when.getDate()).padStart(2, "0");
  const mm = String(when.getMonth() + 1).padStart(2, "0");
  const yyyy = when.getFullYear();
  let hours = when.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const time = `${String(hours).padStart(2, "0")}:${String(when.getMinutes()).padStart(2, "0")} ${ampm}`;
  const day = when.toLocaleDateString("en-IN", { weekday: "long" }).toUpperCase();
  const weight = data.weightKg !== undefined ? `${data.weightKg.toFixed(1)} KG` : "--.- KG";

  const caption = `${dd} ···· ${mm} ···· ${yyyy}    ●    ${time}    ●    ${day}    ●    ${weight}`;

  ctx.fillStyle = "#9b9b9b";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontPx = Math.round(22 * S);
  ctx.font = `500 ${fontPx}px -apple-system, "Segoe UI", system-ui, sans-serif`;
  // letter-spacing is supported in modern engines; harmless if not
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${3 * S}px`;
  } catch {
    /* older engines render without tracking */
  }
  ctx.fillText(caption, W / 2, T.captionY * S, W * 0.9);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Image generation failed"))), "image/jpeg", 0.92),
  );

  // compact thumb of the framed result for the in-app slider
  const tw = 480;
  const th = Math.round((H / W) * tw);
  const thumbCanvas = document.createElement("canvas");
  thumbCanvas.width = tw;
  thumbCanvas.height = th;
  thumbCanvas.getContext("2d")!.drawImage(canvas, 0, 0, tw, th);
  const thumbDataUrl = thumbCanvas.toDataURL("image/jpeg", 0.7);

  const stamp = `${yyyy}-${mm}-${dd}`;
  return {
    blob,
    thumbDataUrl,
    fileName: `aesthetic-${angle}-${stamp}.jpg`,
    capturedAt: when.toISOString(),
  };
}

/** Save the generated image to the user's device (Downloads / share sheet). */
export function saveToDevice(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
