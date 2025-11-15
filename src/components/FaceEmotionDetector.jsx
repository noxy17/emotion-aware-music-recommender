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
      setIsModelLoading(true)
      setError(null)
      
      // Wait for TensorFlow.js to be ready
      await tf.ready()
      console.log('TensorFlow.js ready')
      
      // Use createDetector with SupportedModels (correct API for version 1.0.6)
      const modelType = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh
      console.log('Creating detector with model:', modelType)
      
      // Try TensorFlow.js runtime first (more stable, avoids MediaPipe WASM issues)
      // This runtime doesn't require MediaPipe WASM files and is more compatible
      const detectorConfig = {
        runtime: 'tfjs',
        refineLandmarks: false,
        maxFaces: 1
      }
      
      console.log('Creating detector with TensorFlow.js runtime (more stable)...')
      
      // Create detector with timeout
      const createPromise = faceLandmarksDetection.createDetector(modelType, detectorConfig)
      
      // Add timeout to prevent hanging (30 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Model loading timeout after 30 seconds')), 30000)
      )
      
      const faceLandmarksModel = await Promise.race([createPromise, timeoutPromise])
      
      console.log('Model loaded successfully')
      setModel(faceLandmarksModel)
      setIsModelLoading(false)
    } catch (err) {
      console.error('Error loading model:', err)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load emotion detection model'
      
      if (err.message && err.message.includes('timeout')) {
        errorMessage = 'Model loading timed out. Please check your internet connection and try again.'
      } else if (err.message && (err.message.includes('fetch') || err.message.includes('network'))) {
        errorMessage = 'Unable to download model files. Please check your internet connection and try again.'
      } else if (err.message && err.message.includes('WebGL')) {
        errorMessage = 'WebGL is not supported in your browser. Please try Chrome, Firefox, or Edge.'
      } else if (err.message) {
        errorMessage = `Model loading failed: ${err.message}. Please try refreshing the page.`
      }
      
      setError(errorMessage)
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
    const emotionCheckInterval = 1500 // Check emotion every 1.5 seconds (more responsive)
    let emotionDetected = false
    let frameCount = 0
    let emotionCounts = {} // Track emotion detections
    const requiredDetections = 1 // Only need 1 detection to trigger (more responsive)

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

        const faces = await model.estimateFaces(video, {
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
            
            // Track emotion consistency
            if (emotion) {
              emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1
              
              // Show current detected emotion on canvas
              ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
              ctx.fillRect(10, 10, 250, 50)
              ctx.fillStyle = '#00ff88'
              ctx.font = 'bold 20px Arial'
              ctx.textAlign = 'left'
              ctx.fillText(`Detected: ${emotion}`, 15, 35)
              ctx.fillStyle = '#ffffff'
              ctx.font = '14px Arial'
              ctx.fillText(`Count: ${emotionCounts[emotion]}/${requiredDetections}`, 15, 52)
              
              // If we have consistent detections, send to backend
              if (emotionCounts[emotion] >= requiredDetections) {
                console.log(`✅ Emotion ${emotion} detected ${emotionCounts[emotion]} times, sending to backend...`)
                try {
                  const response = await fetch('/api/process-emotion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emotion, source: 'face' })
                  })
                  
                  console.log('Backend response status:', response.status)
                  
                  if (response.ok) {
                    const data = await response.json()
                    console.log('Backend response data:', data)
                    
                    if (data.processed_emotion) {
                      console.log('✅ Calling onEmotionDetected with:', data.processed_emotion)
                      emotionDetected = true
                      onEmotionDetected(data.processed_emotion)
                      stopDetection()
                      return
                    } else {
                      console.warn('⚠️ No processed_emotion in response:', data)
                    }
                  } else {
                    const errorData = await response.json().catch(() => ({}))
                    console.error('❌ Backend error:', response.status, errorData)
                  }
                } catch (err) {
                  console.error('❌ Error processing emotion:', err)
                  // If API fails, still trigger with detected emotion
                  console.log('🔄 Using detected emotion directly:', emotion)
                  emotionDetected = true
                  onEmotionDetected(emotion)
                  stopDetection()
                  return
                }
              } else {
                console.log(`⏳ Emotion ${emotion} detected ${emotionCounts[emotion]}/${requiredDetections} times...`)
              }
            } else {
              console.log('⚠️ No emotion detected from facial expression')
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
    // Improved emotion detection based on facial landmarks
    const keypoints = face.keypoints
    
    if (!keypoints || keypoints.length === 0) return null

    // Get key facial feature points
    // Using more reliable indices for MediaPipe FaceMesh
    const leftEyeInner = keypoints[33] || keypoints[0]
    const rightEyeInner = keypoints[263] || keypoints[0]
    const leftEyeOuter = keypoints[362] || keypoints[0]
    const rightEyeOuter = keypoints[133] || keypoints[0]
    const noseTip = keypoints[4] || keypoints[0]
    const mouthLeft = keypoints[61] || keypoints[0]
    const mouthRight = keypoints[291] || keypoints[0]
    const mouthTop = keypoints[13] || keypoints[0]
    const mouthBottom = keypoints[14] || keypoints[0]
    
    if (!leftEyeInner || !rightEyeInner || !mouthTop || !mouthBottom) return null

    // Normalize coordinates (they're already normalized 0-1)
    const eyeCenterY = (leftEyeInner.y + rightEyeInner.y) / 2
    const eyeDistance = Math.abs(leftEyeInner.x - rightEyeInner.x)
    const mouthCenterY = (mouthTop.y + mouthBottom.y) / 2
    const mouthWidth = Math.abs(mouthLeft.x - mouthRight.x)
    const mouthHeight = Math.abs(mouthTop.y - mouthBottom.y)
    
    // Calculate facial expression metrics
    const mouthOpenness = mouthHeight / eyeDistance // Normalized by eye distance
    const eyebrowPosition = eyeCenterY // Lower = raised eyebrows
    const mouthCurvature = (mouthLeft.y + mouthRight.y) / 2 - mouthCenterY // Positive = smile
    
    // Improved emotion detection with better thresholds
    const emotions = []
    
    // Happy: Smiling mouth (corners up), open mouth, raised eyebrows
    if (mouthCurvature > 0.01 && mouthOpenness > 0.15) {
      emotions.push({ emotion: 'happy', confidence: Math.min(0.9, mouthCurvature * 50) })
    }
    
    // Sad: Downturned mouth, low eyebrows
    if (mouthCurvature < -0.01 && eyebrowPosition > 0.5) {
      emotions.push({ emotion: 'sad', confidence: Math.min(0.9, Math.abs(mouthCurvature) * 50) })
    }
    
    // Energetic: Wide open mouth, wide eyes
    if (mouthOpenness > 0.25 && eyeDistance > 0.15) {
      emotions.push({ emotion: 'energetic', confidence: Math.min(0.85, mouthOpenness * 3) })
    }
    
    // Calm: Small mouth, relaxed features
    if (mouthOpenness < 0.1 && Math.abs(mouthCurvature) < 0.005) {
      emotions.push({ emotion: 'calm', confidence: 0.7 })
    }
    
    // Stressed: Tight mouth, furrowed brow
    if (mouthOpenness < 0.08 && eyebrowPosition < 0.45) {
      emotions.push({ emotion: 'stressed', confidence: 0.65 })
    }
    
    // Return the emotion with highest confidence, or neutral
    if (emotions.length > 0) {
      emotions.sort((a, b) => b.confidence - a.confidence)
      const detected = emotions[0]
      console.log('Detected emotion:', detected.emotion, 'confidence:', detected.confidence.toFixed(2))
      return detected.emotion
    }
    
    // Default to neutral if no strong emotion detected
    // But still return neutral so it can be detected
    console.log('No strong emotion detected, defaulting to neutral')
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
        <div className="error-icon">⚠️</div>
        <p className="error-message">{error}</p>
        <div className="error-actions">
          <button onClick={loadModel} className="retry-btn">
            🔄 Retry Loading Model
          </button>
          <p className="error-hint">
            💡 Tip: Make sure you have a stable internet connection. The model needs to be downloaded on first use.
          </p>
        </div>
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
          <>
            <button onClick={stopDetection} className="stop-btn">
              Stop Detection
            </button>
            <button 
              onClick={() => {
                console.log('🧪 Manual test: Triggering with neutral emotion')
                onEmotionDetected('neutral')
                stopDetection()
              }} 
              className="test-btn"
              style={{ marginLeft: '10px', padding: '12px 20px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}
            >
              🧪 Test Recommendations
            </button>
          </>
        )}
      </div>
      
      {isDetecting && (
        <div className="detection-status">
          <p>Analyzing your facial expression...</p>
          <p className="detection-hint">
            💡 Try smiling, frowning, or showing different expressions. The system will detect your emotion after a few seconds.
          </p>
        </div>
      )}
    </div>
  )
}

export default FaceEmotionDetector

