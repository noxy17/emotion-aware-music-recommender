import React, { useRef, useState } from 'react'
import './VoiceEmotionDetector.css'

const VoiceEmotionDetector = ({ onEmotionDetected, isDetecting, setIsDetecting }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState(null)
  const [countdown, setCountdown] = useState(5)
  const mediaRecorderRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationFrameRef = useRef(null)
  const countdownIntervalRef = useRef(null)

  const startRecording = async () => {
    try {
      setIsDetecting(true)
      setIsRecording(true)
      setError(null)
      setCountdown(5)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Set up audio context for visualization
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      
      analyser.fftSize = 256
      microphone.connect(analyser)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser

      // Visualize audio levels
      visualizeAudio()

      // Record audio
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        await analyzeVoiceEmotion(audioBlob)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()

      // Countdown timer
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current)
            }
            stopRecording()
            return 0
          }
          return prev - 1
        })
      }, 1000)

    } catch (err) {
      console.error('Error accessing microphone:', err)
      setError('Unable to access microphone. Please check permissions.')
      setIsDetecting(false)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    setIsRecording(false)
    setAudioLevel(0)
  }

  const visualizeAudio = () => {
    if (!analyserRef.current) return

    const analyser = analyserRef.current
    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const updateLevel = () => {
      if (!isRecording) return

      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setAudioLevel(average)

      animationFrameRef.current = requestAnimationFrame(updateLevel)
    }

    updateLevel()
  }

  const analyzeVoiceEmotion = async (audioBlob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')

      const response = await fetch('/api/analyze-voice', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (data.emotion) {
        onEmotionDetected(data.emotion)
      } else {
        setError('Could not detect emotion from voice. Please try again.')
        setIsDetecting(false)
      }
    } catch (err) {
      console.error('Error analyzing voice:', err)
      setError('Error processing voice. Please try again.')
      setIsDetecting(false)
    }
  }

  return (
    <div className="voice-detector">
      <div className="voice-visualizer">
        <div className="audio-wave">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="wave-bar"
              style={{
                height: `${Math.max(10, audioLevel * 0.5 + Math.random() * 20)}px`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="controls">
        {!isRecording ? (
          <button onClick={startRecording} className="record-btn">
            🎤 Start Recording
          </button>
        ) : (
          <button onClick={stopRecording} className="stop-btn">
            ⏹ Stop Recording
          </button>
        )}
      </div>

      {isRecording && (
        <div className="recording-status">
          <div className="countdown-circle">
            <span className="countdown-number">{countdown}</span>
          </div>
          <p className="recording-text">Recording... Speak naturally</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}

export default VoiceEmotionDetector
