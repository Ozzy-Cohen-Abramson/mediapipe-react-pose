import "./App.css";
import { useRef, useEffect, useState } from "react";
import { Pose } from "@mediapipe/pose";
import * as pose from "@mediapipe/pose";
import * as cam from "@mediapipe/camera_utils";
import Webcam from "react-webcam";

function App() {
  const webCamRef = useRef(null);
  const canvasRef = useRef(null);
  let camera = null;
  const dConnect = window.drawConnectors;
  const dLandmarks = window.drawLandmarks;
  // const LandmarksGrid = window.landmarksGrid;
  // const landmarkContainer = document.getElementsByClassName(
  //   "landmark-grid-container"
  // )[0];
  // const grid = new LandmarksGrid(landmarkContainer);
  const [repeats, setRepeats] = useState(0);
  const [position, setPosiotion] = useState(null);
  // const [poseResults, setPoseResults] = useState(null);

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
          color: "#00FF00",
          lineWidth: 4,
        });
        dLandmarks(canvasCtx, results.poseLandmarks, {
          color: "#ffffffe7",
          lineWidth: 0.1,
        });
        canvasCtx.restore();

        // grid.updateLandmarks(results.poseWorldLandmarks);
      }
    } catch (error) {}

    // setPoseResults(results.poseLandmarks);
    const poseResults = results.poseWorldLandmarks;
    let l_wrist_angle;
    try {
      const l_shoulder = poseResults[11];
      const l_elbow = poseResults[13];
      const l_wrist = poseResults[15];
      l_wrist_angle = find_angle(l_shoulder, l_elbow, l_wrist);
      console.log(l_wrist_angle);
      // if (l_wrist_angle) {
      //   if (l_wrist_angle > 160 && position !== "Down") {
      //     setPosiotion("Down");
      //   }
      //   if (l_wrist_angle < 30 && position === "Down") {
      //     setPosiotion("Up");
      //     setRepeats(repeats + 1);
      //   }
      // }
    } catch (err) {
      // console.log("object");
    } finally {
      l_wrist_angle = 0;
    }
  }

  function find_angle(A, B, C) {
    const AB = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
    const BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
    const AC = Math.sqrt(Math.pow(C.x - A.x, 2) + Math.pow(C.y - A.y, 2));
    const acos = Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
    const realAngle = (acos * 180) / Math.PI;
    return realAngle;
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
        width: 640,
        height: 480,
      });
      camera.start();
    }
  });

  return (
    <div className='App'>
      <div className='repeats'>Repeats: {repeats}</div>
      <div className='position'>Position: {position}</div>
      <Webcam className='camera' ref={webCamRef} />
      <canvas className='canvas' ref={canvasRef}></canvas>
    </div>
  );
}

export default App;
