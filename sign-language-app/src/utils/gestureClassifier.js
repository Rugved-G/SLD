// ════════════════════════════════════════════════════════════════
//  src/utils/gestureClassifier.js
//  Rule-based ASL gesture classifier using MediaPipe Hand Landmarks
//
//  MediaPipe Hand Landmark Model returns 21 3D landmarks:
//  https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
//
//  Landmark indices:
//   0 = WRIST
//   1-4  = THUMB  (CMC, MCP, IP, TIP)
//   5-8  = INDEX  (MCP, PIP, DIP, TIP)
//   9-12 = MIDDLE (MCP, PIP, DIP, TIP)
//  13-16 = RING   (MCP, PIP, DIP, TIP)
//  17-20 = PINKY  (MCP, PIP, DIP, TIP)
// ════════════════════════════════════════════════════════════════

/** Landmark indices for finger tips and second knuckles (PIP joints) */
export const FINGER_TIPS = [4, 8, 12, 16, 20];
export const FINGER_PIPS = [3, 6, 10, 14, 18];

/**
 * Determines which fingers are extended.
 * Returns array of 5 booleans: [thumb, index, middle, ring, pinky]
 *
 * Logic:
 *  - Thumb: tip is farther from wrist than MCP joint (side-to-side)
 *  - Others: tip.y < pip.y (tip is above second knuckle in image space)
 *    Note: y increases downward in image coordinates
 *
 * @param {Array<{x,y,z}>} landmarks - 21 normalized landmarks
 * @returns {boolean[]} - [thumb, index, middle, ring, pinky]
 */
export function getFingerState(landmarks) {
  const fingers = [];
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbMcp = landmarks[2];

  // Thumb extended: tip x is further from palm center than MCP
  fingers.push(
    Math.abs(thumbTip.x - wrist.x) > Math.abs(thumbMcp.x - wrist.x)
  );

  // Fingers 1-4: tip above PIP joint
  for (let i = 1; i < 5; i++) {
    fingers.push(landmarks[FINGER_TIPS[i]].y < landmarks[FINGER_PIPS[i]].y);
  }

  return fingers;
}

/**
 * Euclidean distance between two landmarks (2D, ignoring z)
 */
export function getDistance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Main gesture classifier.
 *
 * Technique: Rule-based landmark geometry analysis
 * - Checks which fingers are extended/curled
 * - Measures distances between key landmarks (e.g., thumb tip to index tip)
 * - Uses wrist orientation for up/down detection
 *
 * Supported gestures (ASL approximations):
 *  ✋ Open Hand → Hello / 5
 *  ✊ Fist      → A / S
 *  👍 Thumb Up  → Yes
 *  👎 Thumb Down→ No
 *  ☝️ Index     → D / G / 1
 *  ✌️ Peace     → V / 2
 *  🤟 ILY       → I Love You
 *  🤙 Call Me   → Y
 *  👌 OK        → F
 *  🤘 Rock      → N
 *  🖖 Three     → W / H
 *
 * @param {Array<{x,y,z}>} landmarks - 21 normalized (0-1) hand landmarks
 * @returns {{ sign: string, confidence: number, description: string }}
 */
export function classifyGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return { sign: '?', confidence: 0, description: 'No hand detected' };
  }

  const [thumb, index, middle, ring, pinky] = getFingerState(landmarks);

  // Key landmark references for distance measurements
  const thumbTip  = landmarks[4];
  const indexTip  = landmarks[8];
  const middleTip = landmarks[12];
  const wrist     = landmarks[0];

  // Derived boolean combos
  const allFingers = index && middle && ring && pinky;
  const allClosed  = !index && !middle && !ring && !pinky;

  // ─── GESTURE RULES (ordered by specificity) ────────────────

  // 👌 OK: thumb + index tips close together, others extended
  if (middle && ring && pinky) {
    if (getDistance(thumbTip, indexTip) < 0.07) {
      return { sign: '👌', confidence: 0.87, description: 'OK / F' };
    }
  }

  // 🤟 ILY: thumb + index + pinky extended
  if (thumb && index && !middle && !ring && pinky) {
    return { sign: '🤟', confidence: 0.90, description: 'ILY / I Love You' };
  }

  // 🤙 Call Me: thumb + pinky only
  if (thumb && !index && !middle && !ring && pinky) {
    return { sign: '🤙', confidence: 0.89, description: 'CALL ME / Y' };
  }

  // 👍/👎 Thumb: only thumb extended, direction determines up/down
  if (thumb && allClosed) {
    const thumbUp = thumbTip.y < wrist.y - 0.05;
    if (thumbUp) return { sign: '👍', confidence: 0.93, description: 'THUMBS UP / Yes' };
    return { sign: '👎', confidence: 0.89, description: 'THUMBS DOWN / No' };
  }

  // ✋ Open hand: all 5 fingers extended
  if (allFingers && thumb) {
    return { sign: '✋', confidence: 0.92, description: 'OPEN HAND / Hello' };
  }

  // 🖖 Three fingers: index + middle + ring
  if (!thumb && index && middle && ring && !pinky) {
    return { sign: '🖖', confidence: 0.85, description: 'THREE / W or H' };
  }

  // 🤘 Rock: index + pinky only
  if (!thumb && index && !middle && !ring && pinky) {
    return { sign: '🤘', confidence: 0.88, description: 'ROCK / N' };
  }

  // ✌️ Peace: index + middle only
  if (!thumb && index && middle && !ring && !pinky) {
    const dist = getDistance(indexTip, middleTip);
    if (dist < 0.04) {
      return { sign: '🤞', confidence: 0.81, description: 'CROSSED / R' };
    }
    return { sign: '✌️', confidence: 0.90, description: 'PEACE / V or 2' };
  }

  // ☝️ Index only: D / 1
  if (!thumb && index && !middle && !ring && !pinky) {
    return { sign: '☝️', confidence: 0.91, description: 'INDEX FINGER / D or 1' };
  }

  // ✊ Fist: all closed
  if (allClosed && !thumb) {
    return { sign: '✊', confidence: 0.90, description: 'FIST / A or S' };
  }

  // 4 fingers: index + middle + ring + pinky (no thumb)
  if (!thumb && allFingers) {
    return { sign: '4️⃣', confidence: 0.83, description: 'FOUR / B variant' };
  }

  return { sign: '?', confidence: 0.25, description: 'Unknown — try a clearer gesture' };
}
