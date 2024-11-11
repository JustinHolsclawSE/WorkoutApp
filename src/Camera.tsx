import React, { useState, useEffect, useRef } from 'react';
type Point = { x: number; y: number };
function Camera() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [points, setPoints] = useState<Point[]>([]);
    const [angles, setAngles] = useState<number[]>([]);
  
    useEffect(() => {
      const initCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error("Error accessing the camera:", error);
        }
      };
  
      initCamera();
    }, []);
  
    const startRecording = () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "video/webm",
      });
  
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) setRecordedChunks((prev) => [...prev, event.data]);
      };
  
      mediaRecorderRef.current.start();
      setIsRecording(true);
    };
  
    const stopRecording = () => {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    };
  
    const playRecordedVideo = () => {
      if (recordedChunks.length > 0) {
        const recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
        const videoURL = URL.createObjectURL(recordedBlob);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = videoURL;
          videoRef.current.controls = true;
          videoRef.current.play();
        }
      }
    };
  
    const handlePause = () => {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPaused(true);
      }
    };
  
    const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (isPaused) {
        const rect = e.currentTarget.getBoundingClientRect();
        const newPoint = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        setPoints((prev) => [...prev, newPoint]);
      }
    };
  
    const calculateAngles = () => {
      if (points.length >= 3) {
        const newAngles: number[] = [];
        for (let i = 1; i < points.length - 1; i++) {
          const p1 = points[i - 1];
          const p2 = points[i];
          const p3 = points[i + 1];
  
          const angle = calculateAngleBetweenPoints(p1, p2, p3);
          newAngles.push(angle);
        }
        setAngles(newAngles);
      }
    };
  
    const calculateAngleBetweenPoints = (p1: Point, p2: Point, p3: Point) => {
      const angleRad = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
      const angleDeg = Math.abs((angleRad * 180) / Math.PI);
      return angleDeg > 180 ? 360 - angleDeg : angleDeg;
    };
  
    useEffect(() => {
      calculateAngles();
    }, [points]);
  
    const resetPoints = () => {
      setPoints([]);
      setAngles([]);
    };
  
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-3xl font-bold mb-4">Angle Measurement App with Video</h1>
  
        <div
          className="relative w-full max-w-md h-80 bg-black rounded-lg overflow-hidden"
          onClick={handleClick}
        >
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-70"></video>
  
          {points.map((point, index) => (
            <div
              key={index}
              className="absolute bg-red-500 rounded-full w-4 h-4"
              style={{ left: point.x - 8, top: point.y - 8 }}
            ></div>
          ))}
  
          {points.length >= 2 &&
            points.slice(1).map((point, index) => (
              <svg
                key={`line-${index}`}
                className="absolute"
                width="100%"
                height="100%"
                style={{ left: 0, top: 0 }}
              >
                <line
                  x1={points[index].x}
                  y1={points[index].y}
                  x2={point.x}
                  y2={point.y}
                  stroke="cyan"
                  strokeWidth="2"
                />
              </svg>
            ))}
  
          {angles.map((angle, index) => (
            <div
              key={`angle-${index}`}
              className="absolute text-green-500 text-sm font-semibold"
              style={{
                left: points[index + 1].x + 10,
                top: points[index + 1].y + 10,
              }}
            >
              {angle.toFixed(2)}°
            </div>
          ))}
        </div>
  
        <div className="mt-4 flex space-x-4">
          {!isRecording ? (
            <button onClick={startRecording} className="px-4 py-2 bg-blue-600 rounded-lg">
              Start Recording
            </button>
          ) : (
            <button onClick={stopRecording} className="px-4 py-2 bg-red-600 rounded-lg">
              Stop Recording
            </button>
          )}
          <button onClick={playRecordedVideo} disabled={isRecording} className="px-4 py-2 bg-green-600 rounded-lg">
            Play Video
          </button>
          <button onClick={handlePause} disabled={isRecording} className="px-4 py-2 bg-yellow-600 rounded-lg">
            Pause Video
          </button>
          <button onClick={resetPoints} className="px-4 py-2 bg-gray-600 rounded-lg">
            Reset Points
          </button>
        </div>
      </div>
    );
  };

export default Camera;
