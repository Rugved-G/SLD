// ════════════════════════════════════════════════════════════════
//  src/hooks/useHandDetection.js
//
//  Custom React hook that:
//  1. Loads the MediaPipe Hands model via TensorFlow.js
//  2. Streams webcam video
//  3. Runs the detection loop using requestAnimationFrame
//  4. Returns predictions, FPS, and control functions
// ════════════════════════════════════════════════════════════════
import { useState, useRef, useCallback, useEffect } from 'react';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import { classifyGesture } from '../utils/gestureClassifier';
import { drawHand } from '../utils/drawHand';

const MODEL_CONFIG = {
  runtime: 'mediapipe',
  solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
  modelType: 'lite',   // 'lite' = faster; 'full' = more accurate
  maxHands: 1,
};

/**
 * useHandDetection Hook
 *
 * @param {React.RefObject} videoRef  - ref attached to <video> element
 * @param {React.RefObject} canvasRef - ref attached to overlay <canvas>
 *
 * @returns {{
 *   isLoading: boolean,
 *   modelReady: boolean,
 *   isRunning: boolean,
 *   prediction: {sign, confidence, description} | null,
 *   handsDetected: number,
 *   fps: number,
 *   startDetection: function,
 *   stopDetection: function,
 * }}
 */
export function useHandDetection(videoRef, canvasRef) {
  const detectorRef    = useRef(null);
  const rafRef         = useRef(null);
  const fpsCountRef    = useRef(0);
  const lastFpsTime    = useRef(Date.now());

  const [isLoading,    setIsLoading]    = useState(false);
  const [modelReady,   setModelReady]   = useState(false);
  const [isRunning,    setIsRunning]    = useState(false);
  const [prediction,   setPrediction]   = useState(null);
  const [handsDetected,setHandsDetected]= useState(0);
  const [fps,          setFps]          = useState(0);

  // ── Load model on mount ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const model    = handPoseDetection.SupportedModels.MediaPipeHands;
        detectorRef.current = await handPoseDetection.createDetector(model, MODEL_CONFIG);
        if (!cancelled) setModelReady(true);
      } catch (err) {
        console.error('[HandDetection] Model load failed:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // ── Detection loop (runs via requestAnimationFrame) ──────
  const runDetectionLoop = useCallback(() => {
    const loop = async () => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || !detectorRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      if (video.readyState < 2) {          // video not ready yet
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Sync canvas to video resolution
      canvas.width  = video.videoWidth  || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // FPS tracking
      fpsCountRef.current++;
      const now = Date.now();
      if (now - lastFpsTime.current >= 1000) {
        setFps(fpsCountRef.current);
        fpsCountRef.current = 0;
        lastFpsTime.current = now;
      }

      try {
        // ── Run MediaPipe Hands inference ──
        const hands = await detectorRef.current.estimateHands(video, {
          flipHorizontal: true,   // mirror webcam
        });
        setHandsDetected(hands.length);

        if (hands.length > 0) {
          const hand = hands[0];
          // Normalize keypoints to 0-1 range
          const lm = hand.keypoints.map(kp => ({
            x: kp.x / canvas.width,
            y: kp.y / canvas.height,
            z: kp.z ?? 0,
          }));

          // Draw skeleton on canvas overlay
          drawHand(ctx, lm, canvas.width, canvas.height);

          // Classify the gesture
          const result = classifyGesture(lm);
          setPrediction(result);
        } else {
          setPrediction(null);
        }
      } catch (_) {
        // Frame errors are expected during stream transitions
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [videoRef, canvasRef]);

  // ── Start detection ──────────────────────────────────────
  const startDetection = useCallback(async () => {
    if (!modelReady) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setIsRunning(true);
      runDetectionLoop();
    } catch (err) {
      console.error('[HandDetection] Camera error:', err);
      throw err; // propagate to UI for user feedback
    }
  }, [modelReady, videoRef, runDetectionLoop]);

  // ── Stop detection ───────────────────────────────────────
  const stopDetection = useCallback(() => {
    cancelAnimationFrame(rafRef.current);

    // Stop all camera tracks
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }

    setIsRunning(false);
    setPrediction(null);
    setHandsDetected(0);
    setFps(0);
  }, [videoRef, canvasRef]);

  // ── Cleanup on unmount ───────────────────────────────────
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [videoRef]);

  return {
    isLoading,
    modelReady,
    isRunning,
    prediction,
    handsDetected,
    fps,
    startDetection,
    stopDetection,
  };
}
