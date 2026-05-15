import { writeFileSync } from "fs";
import { createCanvas } from "@napi-rs/canvas";

const sizes = [16, 48, 128];

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background with rounded corners
  const radius = size * 0.125;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = "#2563eb";
  ctx.fill();

  // Letter M
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${size * 0.625}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("M", size / 2, size / 2 + size * 0.05);

  const buffer = canvas.toBuffer("image/png");
  writeFileSync(`public/icons/icon-${size}.png`, buffer);
  console.log(`Generated icon-${size}.png`);
}
