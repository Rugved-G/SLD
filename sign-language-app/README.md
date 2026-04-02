# 🖐 SignLang AI — Real-Time Sign Language Detection

A browser-only sign language detection app built with **React** + **TensorFlow.js** + **MediaPipe Hands**.
No backend. No Python. No server. Everything runs in the browser.

---

## 🏗 Architecture Overview

```
Browser
  └── React App
        ├── useHandDetection (hook)
        │     ├── TensorFlow.js (tfjs-backend-webgl)
        │     └── MediaPipe Hands model (tfjs-models/hand-pose-detection)
        │           └── 21 3D landmarks per hand @ 15–30 FPS
        ├── gestureClassifier (util)
        │     └── Rule-based geometry → sign label
        ├── drawHand (util)
        │     └── Canvas overlay (skeleton + dots)
        └── useSpeech (hook)
              └── Web Speech API (TTS)
```

### How MediaPipe Hands Works
1. The model ingests each video frame as a tensor.
2. It returns 21 3D landmarks `{x, y, z}` normalized to `[0, 1]`.
3. Our rule-based classifier reads which fingers are extended using landmark geometry.
4. A gesture label + confidence score is displayed.

### Gesture Classification Logic
- **Finger extension**: tip.y < pip.y (in image space where y increases downward)
- **Thumb extension**: tip.x is further from wrist than MCP joint
- **Distance-based**: tip-to-tip distance (e.g., thumb+index for OK sign)

---

## 🚀 Setup Instructions

### Option A — Zero Install (Recommended for testing)
Just open `index.html` in Chrome or Edge. Done. No npm needed.

> ⚠️ Use a local server to avoid CORS issues with the MediaPipe model files:
> ```bash
> npx serve .     # or python -m http.server 3000
> ```

---

### Option B — Full React Project (npm)

#### 1. Prerequisites
- **Node.js 18+**: https://nodejs.org
- **Chrome or Edge** (best WebGL support for TensorFlow.js)

#### 2. Install dependencies
```bash
npm install
```

#### 3. Run locally
```bash
npm start
```
Opens at `http://localhost:3000`

#### 4. Build for production
```bash
npm run build
```

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `@tensorflow/tfjs` | ML inference engine (WebGL backend) |
| `@tensorflow-models/hand-pose-detection` | MediaPipe Hands model |
| `@mediapipe/hands` | MediaPipe runtime for the model |
| `react` | UI framework |

---

## 🧪 Testing Gestures

| Gesture | How to make it | Expected output |
|---|---|---|
| ✋ Open Hand | All 5 fingers spread wide | `OPEN HAND / Hello` |
| ✊ Fist | Close all fingers tightly | `FIST / A or S` |
| 👍 Thumbs Up | Fist with thumb pointing up | `THUMBS UP / Yes` |
| 👎 Thumbs Down | Fist with thumb pointing down | `THUMBS DOWN / No` |
| ☝️ Index Only | Point with one finger | `INDEX FINGER / D or 1` |
| ✌️ Peace Sign | Index + middle fingers up | `PEACE / V or 2` |
| 🤟 ILY | Thumb + index + pinky extended | `ILY / I Love You` |
| 🤙 Call Me | Thumb + pinky extended | `CALL ME / Y` |
| 👌 OK | Thumb + index tips touching | `OK / F` |

### Tips for best detection:
- Hold your hand **30–60 cm** from the camera
- Ensure **good lighting** (face the light source, don't backlight)
- **Plain background** (light-colored wall works best)
- Hold each gesture **still for 1.5 seconds** to add it to the sentence
- Position your hand **within the corner brackets** shown on camera

---

## ⚡ Performance Notes

- **WebGL backend**: TensorFlow.js uses your GPU via WebGL for ~30 FPS inference
- **requestAnimationFrame**: The detection loop is tied to the display refresh rate
- **Model type**: `lite` is used for speed; switch to `full` in `useHandDetection.js` for accuracy
- **Max hands**: Set to 1 for performance; change `maxHands: 2` for two-hand support

---

## 🔮 Future Improvements

1. **Train a custom model**: Use TensorFlow.js transfer learning on a full ASL dataset
2. **Full alphabet (A-Z)**: Extend the rule-based classifier with more finger angle measurements
3. **Dynamic gestures**: Add RNN/LSTM for motion-based signs (Hello wave, etc.)
4. **Two hands**: Enable `maxHands: 2` for two-handed signs
5. **Confidence threshold**: Only append gestures above 85% confidence
6. **Word prediction**: Auto-complete partial sentences with a language model
7. **Export**: Save gesture session as a transcript
8. **Dataset**: Record your own hand data and fine-tune the model in-browser

---

## 📁 Project Structure

```
sign-lang-app/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── CameraView.jsx      # Video + canvas overlay UI
│   │   ├── PredictionPanel.jsx # Shows current gesture + confidence
│   │   └── SentenceBuilder.jsx # Builds sentences from gestures
│   ├── hooks/
│   │   ├── useHandDetection.js # TF.js model + detection loop
│   │   └── useSpeech.js        # Web Speech API wrapper
│   ├── utils/
│   │   ├── gestureClassifier.js # Rule-based ASL classifier
│   │   └── drawHand.js          # Canvas landmark drawing
│   ├── App.js                   # Root component
│   ├── App.css                  # All styles
│   └── index.js                 # React entry point
├── package.json
└── README.md
```
