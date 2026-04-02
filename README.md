🖐 SLD — Real-Time Sign Language Detector

SLD is a high-performance, browser-based Sign Language detection application. Unlike traditional AI projects, this requires no backend, no Python, and no external server—the entire machine learning pipeline runs directly in your browser using the user's GPU.


🚀 Project Overview

This application leverages TensorFlow.js and MediaPipe Hands to perform real-time hand landmark detection at 15–30 FPS. It uses a custom rule-based geometric classifier to interpret hand shapes into American Sign Language (ASL) letters and common gestures.

🏗 Architecture

-React App: The core UI framework managing the application state.

-MediaPipe Hands: Utilizes a lite model to extract 21 3D landmarks (x, y, z) from each video frame.

-Custom Classifier: A geometric engine that calculates finger extensions and tip-to-tip distances to identify signs.

-Web Speech API: Integrated Text-to-Speech (TTS) that vocalizes detected signs to the user.


📂 Project Structure

To ensure Vercel can deploy this correctly, your repository should follow this structure:
SLD/
├── public/
│   └── index.html           # Main entry point (renamed from index (8).html)
├── src/
│   ├── hooks/
│   │   ├── useHandDetection.js # TF.js model & detection loop
│   │   └── useSpeech.js        # Web Speech API wrapper
│   ├── utils/
│   │   ├── gestureClassifier.js # Rule-based ASL classifier logic
│   │   └── drawHand.js          # Canvas landmark drawing utility
│   ├── App.js               # Main React component
│   └── index.js             # React DOM entry point
├── package.json             # Project dependencies and scripts
└── README.md                # Project documentation


🧪 Supported Gestures

The current version of SLD supports the following gestures out of the box:
Gesture       Meaning/Letter       Detection Logic

✋ Open       HandHello        All 5 fingers extended
✊ Fist         A or S         All fingers retracted
👍 Thumbs Up     Yes           Fist with thumb extended upward
👎 Thumbs        Down          NoFist with thumb extended downward
✌️ Peace Sign   V or 2         Index and middle fingers extended
🤟 ILY         I Love You      Thumb, index, and pinky extended
👌 OK             F            Thumb and index tips touching


🛠 Setup & Installation

For Local Development
Clone the repository:Bashgit clone https://github.com/Rugved-G/SDL.git
cd SDL
Install dependencies:Bashnpm install
Start the dev server:Bashnpm start
For Production (Vercel)This project is pre-configured for Vercel. 
Simply push your code to GitHub, and Vercel will detect the package.json to build and deploy the site automatically.


⚡ Performance Tips

-Lighting: Ensure your hand is well-lit from the front.
-Background: Use a plain, non-cluttered background for better landmark accuracy.
-Hardware: A dedicated GPU (even an integrated one) significantly boosts the FPS via the WebGL backend.
