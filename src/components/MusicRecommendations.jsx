import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './MusicRecommendations.css'

const MusicRecommendations = ({ emotion, onClear }) => {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('🎵 MusicRecommendations: Emotion changed to:', emotion)
    if (emotion) {
      fetchRecommendations()
    }
  }, [emotion])

  const fetchRecommendations = async () => {
    try {
      console.log('🎵 Fetching recommendations for emotion:', emotion)
      setLoading(true)
      setError(null)

      const response = await axios.post('/api/recommend-music', {
        emotion: emotion
      })

      console.log('🎵 Recommendations received:', response.data)
      const recs = response.data.recommendations || []
      console.log('🎵 Number of recommendations:', recs.length)
      
      if (recs.length === 0) {
        console.log('⚠️ No recommendations from API, using fallback')
        setRecommendations(getFallbackRecommendations(emotion))
      } else {
        setRecommendations(recs)
      }
      setLoading(false)
    } catch (err) {
      console.error('❌ Error fetching recommendations:', err)
      console.log('🔄 Using fallback recommendations for:', emotion)
      setError('Failed to fetch music recommendations. Using fallback recommendations.')
      // Fallback recommendations
      setRecommendations(getFallbackRecommendations(emotion))
      setLoading(false)
    }
  }

  const getFallbackRecommendations = (emotion) => {
    const fallbackPlaylists = {
      happy: [
        { name: 'Happy Hits', artist: 'Various Artists', url: '#', type: 'playlist' },
        { name: 'Upbeat Pop', artist: 'Various Artists', url: '#', type: 'playlist' },
        { name: 'Feel Good Music', artist: 'Various Artists', url: '#', type: 'playlist' }
      ],
      sad: [
        { name: 'Melancholic Melodies', artist: 'Various Artists', url: '#', type: 'playlist' },
        { name: 'Emotional Ballads', artist: 'Various Artists', url: '#', type: 'playlist' },
        { name: 'Reflective Tunes', artist: 'Various Artists', url: '#', type: 'playlist' }
      ],
      energetic: [
        { name: 'High Energy Workout', artist: 'Various Artists', url: '#', type: 'playlist' },
        { name: 'Power Anthems', artist: 'Various Artists', url: '#', type: 'playlist' },
        { name: 'Energetic Beats', artist: 'Various Artists', url: '#', type: 'playlist' }
      ],
      calm: [
        { name: 'Peaceful Sounds', artist: 'Various Artists', url: '#', type: 'playlist' },
        { name: 'Meditation Music', artist: 'Various Artists', url: '#', type: 'playlist' },
        { name: 'Relaxing Vibes', artist: 'Various Artists', url: '#', type: 'playlist' }
      ],
      stressed: [
        { name: 'Stress Relief', artist: 'Various Artists', url: '#', type: 'playlist' },
        { name: 'Calming Nature Sounds', artist: 'Various Artists', url: '#', type: 'playlist' },
        { name: 'Zen Music', artist: 'Various Artists', url: '#', type: 'playlist' }
      ],
      neutral: [
        { name: 'Chill Vibes', artist: 'Various Artists', url: '#', type: 'playlist' },
        { name: 'Background Music', artist: 'Various Artists', url: '#', type: 'playlist' },
        { name: 'Easy Listening', artist: 'Various Artists', url: '#', type: 'playlist' }
      ]
    }

    return fallbackPlaylists[emotion.toLowerCase()] || fallbackPlaylists.neutral
  }

  const getEmotionEmoji = (emotion) => {
    const emojis = {
      happy: '😊',
      sad: '😢',
      energetic: '⚡',
      calm: '😌',
      stressed: '😰',
      neutral: '😐'
    }
    return emojis[emotion.toLowerCase()] || '🎵'
  }

  return (
    <div className="music-recommendations">
      <div className="recommendations-header">
        <h2>
          {getEmotionEmoji(emotion)} Recommendations for {emotion}
        </h2>
        <button onClick={onClear} className="clear-btn">
          ✕
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Finding perfect music for you...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
        </div>
      ) : (
        <div className="recommendations-list">
          {recommendations.map((item, index) => (
            <div key={index} className="recommendation-item">
              <div className="item-info">
                <h3>{item.name}</h3>
                <p className="artist">{item.artist}</p>
                <span className="item-type">{item.type}</span>
              </div>
              <div className="item-actions">
                {item.url && item.url !== '#' ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="play-btn"
                  >
                    ▶ Play
                  </a>
                ) : (
                  <button className="play-btn" disabled>
                    ▶ Play
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="recommendations-footer">
        <p className="note">
          💡 Tip: Connect your Spotify account in settings for personalized recommendations
        </p>
      </div>
    </div>
  )
}

export default MusicRecommendations

