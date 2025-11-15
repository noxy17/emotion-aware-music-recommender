import React, { useState } from 'react'
import EmotionDetector from './components/EmotionDetector'
import MusicRecommendations from './components/MusicRecommendations'
import './App.css'

function App() {
  const [detectedEmotion, setDetectedEmotion] = useState(null)
  const [isDetecting, setIsDetecting] = useState(false)

  // Debug: Log when emotion is detected
  React.useEffect(() => {
    if (detectedEmotion) {
      console.log('🎵 App: Emotion detected, showing recommendations for:', detectedEmotion)
    }
  }, [detectedEmotion])

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎵 Emotion-Aware Music Recommender</h1>
        <p>Let your emotions guide your music discovery</p>
      </header>
      
      <main className="app-main">
        <EmotionDetector 
          onEmotionDetected={setDetectedEmotion}
          isDetecting={isDetecting}
          setIsDetecting={setIsDetecting}
        />
        
        {detectedEmotion && (
          <MusicRecommendations 
            emotion={detectedEmotion}
            onClear={() => setDetectedEmotion(null)}
          />
        )}
      </main>
    </div>
  )
}

export default App

