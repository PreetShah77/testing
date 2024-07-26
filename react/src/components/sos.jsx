import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function SOS() {
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => console.error("Error getting location:", error)
    );

    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    const tracks = stream?.getTracks();
    tracks?.forEach(track => track.stop());
  };

  const captureImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    setImage(imageDataUrl);
  };

  const retakeImage = () => {
    setImage(null);
  };

  const submitSOS = async () => {
    if (!image || !location) {
      alert("Please capture an image and allow location access.");
      return;
    }

    try {
      const response = await axios.post('http://localhost:5050/api/sos', {
        image: image,
        latitude: location.latitude,
        longitude: location.longitude
      });
      alert("SOS submitted successfully!");
      // Redirect or show success message
    } catch (error) {
      console.error("Error submitting SOS:", error);
      alert("Failed to submit SOS. Please try again.");
    }
  };

  return (
    <div className="sos-container">
      <h2>SOS - Emergency Reporting</h2>
      {!image ? (
        <>
          <video ref={videoRef} autoPlay />
          <button onClick={captureImage}>Capture Image</button>
        </>
      ) : (
        <>
          <img src={image} alt="Captured" />
          <button onClick={retakeImage}>Retake</button>
        </>
      )}
      <button onClick={submitSOS} disabled={!image || !location}>Submit SOS</button>
    </div>
  );
}

export default SOS;