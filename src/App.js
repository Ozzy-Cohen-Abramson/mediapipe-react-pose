import "./App.css";
import { useRef, useEffect, useState } from "react";
import { Pose } from "@mediapipe/pose";
import * as pose from "@mediapipe/pose";
import * as cam from "@mediapipe/camera_utils";
import Webcam from "react-webcam";

function App() {
  // const [repeats, setRepeats] = useState(0);
  // const [position, setPosiotion] = useState(null);
  const webCamRef = useRef(null);
  const canvasRef = useRef(null);
  let camera = null;
  const dConnect = window.drawConnectors;
  const dLandmarks = window.drawLandmarks;
  let limbPos = null;
  let repeats = 0;

  function find_angle(A, B, C) {
    const AB = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
    const BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
    const AC = Math.sqrt(Math.pow(C.x - A.x, 2) + Math.pow(C.y - A.y, 2));
    const acos = Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
    const realAngle = (acos * 180) / Math.PI;
    return realAngle;
  }

  const change_angle = (pos, angle) => {
    if (angle > 160 && pos !== "Down") {
      // setPosiotion("Down");
      limbPos = "Down";
      console.log(angle, limbPos, repeats);
    }
    if (angle < 30 && pos === "Down") {
      limbPos = "Up";
      repeats += 1;
      // setPosiotion("Up");
      // setRepeats(repeats + 1);
      console.log(angle, limbPos, repeats);
    }
  };

  function onResults(results) {
    // Setting h , w of canvas
    canvasRef.current.width = webCamRef.current.video.videoWidth;
    canvasRef.current.height = webCamRef.current.video.videoHeight;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");
    try {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );
      if (results.poseLandmarks) {
        canvasCtx.globalCompositeOperation = "source-over";
        dConnect(canvasCtx, results.poseLandmarks, pose.POSE_CONNECTIONS, {
          color: "#ffffff",
          lineWidth: 2,
        });
        dLandmarks(canvasCtx, results.poseLandmarks, {
          color: "#ce0000e7",
          lineWidth: 1,
        });
        canvasCtx.restore();

        const poseResults = results.poseWorldLandmarks;

        const l_shoulder = poseResults[11];
        const l_elbow = poseResults[13];
        const l_wrist = poseResults[15];
        const l_wrist_angle = find_angle(l_shoulder, l_elbow, l_wrist);

        change_angle(limbPos, l_wrist_angle);
      }
    } catch (error) {}
    // console.log(results);
  }

  useEffect(() => {
    const myPose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });

    myPose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    myPose.onResults(onResults);

    if (
      typeof webCamRef.current !== "undefined" &&
      webCamRef.current !== null
    ) {
      camera = new cam.Camera(webCamRef.current.video, {
        onFrame: async () => {
          await myPose.send({ image: webCamRef.current.video });
        },
        width: 1080,
        height: 720,
      });
      camera.start();
    }
  });

  return (
    <div>
      <h1>Mediapipe Pose detection</h1>
      <Webcam className='camera' ref={webCamRef} />
      <canvas className='canvas' ref={canvasRef}></canvas>
    </div>
  );
}

export default App;
