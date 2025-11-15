import React, { useRef, useEffect, useState } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import './FaceEmotionDetector.css'

const FaceEmotionDetector = ({ onEmotionDetected, isDetecting, setIsDetecting }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [model, setModel] = useState(null)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadModel()
    return () => {
      if (videoRef.current) {
        const stream = videoRef.current.srcObject
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
        }
      }
    }
  }, [])

  const loadModel = async () => {
    try {
      await tf.ready()
      const faceLandmarksModel = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
      )
      setModel(faceLandmarksModel)
      setIsModelLoading(false)
    } catch (err) {
      console.error('Error loading model:', err)
      setError('Failed to load emotion detection model')
      setIsModelLoading(false)
    }
  }

  const startDetection = async () => {
    try {
      setIsDetecting(true)
      setError(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        
        // Wait for video to be ready before starting detection
        videoRef.current.onloadedmetadata = () => {
          detectEmotion()
        }
        
        // Fallback if onloadedmetadata doesn't fire
        setTimeout(() => {
          if (videoRef.current && videoRef.current.videoWidth > 0) {
            detectEmotion()
          }
        }, 500)
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Unable to access camera. Please check permissions.')
      setIsDetecting(false)
    }
  }

  const stopDetection = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsDetecting(false)
  }

  const detectEmotion = async () => {
    if (!model || !videoRef.current || !canvasRef.current) {
      console.log('Missing requirements for detection')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Wait for video dimensions
    if (!video.videoWidth || !video.videoHeight) {
      setTimeout(() => detectEmotion(), 100)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    let lastEmotionCheck = 0
    const emotionCheckInterval = 3000 // Check emotion every 3 seconds
    let emotionDetected = false
    let frameCount = 0

    const detect = async () => {
      if (!isDetecting || !video.videoWidth || emotionDetected) {
        return
      }

      try {
        // Only process every 3rd frame for better performance
        frameCount++
        if (frameCount % 3 !== 0) {
          requestAnimationFrame(detect)
          return
        }

        const faces = await model.estimateFaces({
          input: video,
          returnTensors: false,
          flipHorizontal: false,
          staticImageMode: false
        })

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        if (faces.length > 0) {
          // Draw face mesh (simplified - only key points)
          if (faces[0].keypoints && faces[0].keypoints.length > 0) {
            const keyPoints = faces[0].keypoints.filter((_, i) => i % 10 === 0) // Sample every 10th point
            keyPoints.forEach(keypoint => {
              ctx.beginPath()
              ctx.arc(keypoint.x, keypoint.y, 2, 0, 2 * Math.PI)
              ctx.fillStyle = '#00ff88'
              ctx.fill()
            })
          }

          // Analyze facial landmarks to determine emotion (debounced)
          const now = Date.now()
          if (now - lastEmotionCheck > emotionCheckInterval) {
            lastEmotionCheck = now
            const emotion = analyzeFacialExpression(faces[0])
            
            // Send emotion to backend for processing
            if (emotion) {
              try {
                const response = await fetch('/api/process-emotion', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ emotion, source: 'face' })
                })
                if (response.ok) {
                  const data = await response.json()
                  if (data.processed_emotion) {
                    emotionDetected = true
                    onEmotionDetected(data.processed_emotion)
                    stopDetection()
                    return
                  }
                }
              } catch (err) {
                console.error('Error processing emotion:', err)
                // Continue detection even if API call fails
              }
            }
          }
        } else {
          ctx.fillStyle = 'rgba(255, 100, 100, 0.2)'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.fillStyle = 'white'
          ctx.font = 'bold 24px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('👤 Position your face in the camera', canvas.width / 2, canvas.height / 2)
        }

        requestAnimationFrame(detect)
      } catch (err) {
        console.error('Detection error:', err)
        requestAnimationFrame(detect)
      }
    }

    detect()
  }

  const analyzeFacialExpression = (face) => {
    // Simplified emotion detection based on facial landmarks
    // In production, you'd use a trained emotion recognition model
    const keypoints = face.keypoints
    
    if (!keypoints || keypoints.length === 0) return null

    // MediaPipe FaceMesh returns 468 landmarks
    // Use approximate indices for facial features (these are approximate)
    // Left eye center (around index 33)
    // Right eye center (around index 263)
    // Nose tip (around index 4)
    // Mouth center (around index 13)
    
    const leftEyeIdx = Math.min(33, keypoints.length - 1)
    const rightEyeIdx = Math.min(263, keypoints.length - 1)
    const noseIdx = Math.min(4, keypoints.length - 1)
    const mouthIdx = Math.min(13, keypoints.length - 1)
    
    const leftEye = keypoints[leftEyeIdx]
    const rightEye = keypoints[rightEyeIdx]
    const noseTip = keypoints[noseIdx]
    const mouthCenter = keypoints[mouthIdx]
    
    if (!leftEye || !rightEye || !mouthCenter) return null

    // Calculate distances and angles for emotion detection
    const eyeDistance = Math.abs(leftEye.x - rightEye.x)
    const mouthY = mouthCenter.y
    const noseY = noseTip ? noseTip.y : (leftEye.y + rightEye.y) / 2
    
    // Simple heuristic-based emotion detection
    // This is a simplified version - in production use a trained ML model
    const mouthOpenness = Math.abs(mouthY - noseY)
    const eyeOpenness = (Math.abs(leftEye.y - (leftEye.y + rightEye.y) / 2) + 
                        Math.abs(rightEye.y - (leftEye.y + rightEye.y) / 2)) / 2
    
    // For demo purposes, use heuristics to determine emotion
    // In production, this would use a trained emotion classifier
    // High mouth openness + high eye openness = happy
    if (mouthOpenness > 0.1 && eyeOpenness > 0.05) {
      return 'happy'
    }
    // Low mouth position relative to nose = sad
    if (mouthY > noseY + 0.05) {
      return 'sad'
    }
    // Medium values = neutral
    return 'neutral'
  }

  if (isModelLoading) {
    return (
      <div className="face-detector-loading">
        <div className="spinner"></div>
        <p>Loading emotion detection model...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="face-detector-error">
        <p>{error}</p>
        <button onClick={startDetection} className="retry-btn">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="face-detector">
      <div className="video-container">
        <video
          ref={videoRef}
          className="video-element"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="canvas-overlay" />
      </div>
      
      <div className="controls">
        {!isDetecting ? (
          <button onClick={startDetection} className="detect-btn">
            Start Detection
          </button>
        ) : (
          <button onClick={stopDetection} className="stop-btn">
            Stop Detection
          </button>
        )}
      </div>
      
      {isDetecting && (
        <p className="detection-status">Analyzing your facial expression...</p>
      )}
    </div>
  )
}

export default FaceEmotionDetector

