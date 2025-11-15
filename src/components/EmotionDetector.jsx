import React, { useState, useRef, useEffect } from 'react'
import FaceEmotionDetector from './FaceEmotionDetector'
import VoiceEmotionDetector from './VoiceEmotionDetector'
import './EmotionDetector.css'

const EmotionDetector = ({ onEmotionDetected, isDetecting, setIsDetecting }) => {
  const [detectionMode, setDetectionMode] = useState('face') // 'face' or 'voice'
  const [currentEmotion, setCurrentEmotion] = useState(null)

  const handleEmotionDetected = (emotion) => {
    setCurrentEmotion(emotion)
    onEmotionDetected(emotion)
    setIsDetecting(false)
  }

  return (
    <div className="emotion-detector">
      <div className="detector-header">
        <h2>Detect Your Emotion</h2>
        <div className="mode-selector">
          <button
            className={`mode-btn ${detectionMode === 'face' ? 'active' : ''}`}
            onClick={() => setDetectionMode('face')}
            disabled={isDetecting}
          >
            📷 Facial Expression
          </button>
          <button
            className={`mode-btn ${detectionMode === 'voice' ? 'active' : ''}`}
            onClick={() => setDetectionMode('voice')}
            disabled={isDetecting}
          >
            🎤 Voice Analysis
          </button>
        </div>
      </div>

      <div className="detector-content">
        {detectionMode === 'face' ? (
          <FaceEmotionDetector
            onEmotionDetected={handleEmotionDetected}
            isDetecting={isDetecting}
            setIsDetecting={setIsDetecting}
          />
        ) : (
          <VoiceEmotionDetector
            onEmotionDetected={handleEmotionDetected}
            isDetecting={isDetecting}
            setIsDetecting={setIsDetecting}
          />
        )}
      </div>

      {currentEmotion && (
        <div className="detected-emotion">
          <h3>Detected Emotion:</h3>
          <div className="emotion-badge">{currentEmotion}</div>
        </div>
      )}
    </div>
  )
}

export default EmotionDetector

