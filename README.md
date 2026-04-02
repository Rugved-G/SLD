🖐 SLD — Real-Time Sign Language Detector
SLD is a high-performance, browser-based Sign Language detection application. Unlike traditional AI projects, this requires no backend, no Python, and no external server—the entire machine learning pipeline runs directly in your browser using the user's GPU.

🚀 Project Overview
This application leverages TensorFlow.js and MediaPipe Hands to perform real-time hand landmark detection at 15–30 FPS. It uses a custom rule-based geometric classifier to interpret hand shapes into American Sign Language (ASL) letters and common gestures.

🏗 Architecture
React App: The core UI framework managing the application state.

MediaPipe Hands: Utilizes a lite model to extract 21 3D landmarks (x, y, z) from each video frame.

Custom Classifier: A geometric engine that calculates finger extensions and tip-to-tip distances to identify signs.

Web Speech API: Integrated Text-to-Speech (TTS) that vocalizes detected signs to the user.
