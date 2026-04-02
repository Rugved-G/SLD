// ════════════════════════════════════════════════════════════════
//  src/utils/drawHand.js
//  Draws MediaPipe hand landmarks and skeleton on an HTML5 Canvas
// ════════════════════════════════════════════════════════════════

/**
 * MediaPipe hand connections — pairs of landmark indices to draw lines between.
 * Source: https://mediapipe.dev/solutions/hands#hand-landmark-model
 */
export const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky finger
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base connections
  [5, 9], [9, 13], [13, 17],
];

/** Indices of fingertip landmarks */
const TIP_INDICES = new Set([4, 8, 12, 16, 20]);

/**
 * Draw hand skeleton and landmarks onto a canvas.
 *
 * @param {CanvasRenderingContext2D} ctx   - Canvas 2D context
 * @param {Array<{x,y,z}>}          lm    - 21 NORMALIZED landmarks (0 to 1)
 * @param {number}                  W     - Canvas width in pixels
 * @param {number}                  H     - Canvas height in pixels
 * @param {string}                  [lineColor]  - Skeleton line color
 * @param {string}                  [tipColor]   - Fingertip dot color
 * @param {string}                  [jointColor] - Joint dot color
 */
export function drawHand(
  ctx, lm, W, H,
  lineColor  = 'rgba(0, 217, 245, 0.75)',
  tipColor   = '#00f5a0',
  jointColor = '#00d9f5'
) {
  // ── Draw skeleton connections ──────────────────────────────
  ctx.strokeStyle = lineColor;
  ctx.lineWidth   = 2;
  ctx.lineCap     = 'round';

  HAND_CONNECTIONS.forEach(([a, b]) => {
    const lA = lm[a], lB = lm[b];
    ctx.beginPath();
    ctx.moveTo(lA.x * W, lA.y * H);
    ctx.lineTo(lB.x * W, lB.y * H);
    ctx.stroke();
  });

  // ── Draw landmark dots ─────────────────────────────────────
  lm.forEach((point, i) => {
    const x   = point.x * W;
    const y   = point.y * H;
    const tip = TIP_INDICES.has(i);

    ctx.beginPath();
    ctx.arc(x, y, tip ? 7 : 4, 0, Math.PI * 2);

    // Glowing fill for fingertips, solid for joints
    if (tip) {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 7);
      grad.addColorStop(0, tipColor);
      grad.addColorStop(1, 'rgba(0,245,160,0.1)');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = jointColor;
    }
    ctx.fill();

    // Thin dark border for visibility on bright backgrounds
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth   = 1;
    ctx.stroke();
  });

  // ── Draw wrist label ───────────────────────────────────────
  const wx = lm[0].x * W;
  const wy = lm[0].y * H;
  ctx.fillStyle    = 'rgba(0,245,160,0.8)';
  ctx.font         = 'bold 10px monospace';
  ctx.fillText('WRIST', wx + 6, wy + 4);
}
