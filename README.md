# 🎵 Emotion-Aware Music Recommender

A web-based application that detects your emotions through facial expression recognition or voice sentiment analysis and recommends personalized music playlists based on your emotional state.

## Features

- **Dual Emotion Detection Methods:**
  - 📷 **Facial Expression Recognition**: Real-time emotion detection using your device camera
  - 🎤 **Voice Sentiment Analysis**: Analyze emotions from voice recordings

- **Emotion Support:**
  - 😊 Happy
  - 😢 Sad
  - ⚡ Energetic
  - 😌 Calm
  - 😰 Stressed
  - 😐 Neutral

- **Music Recommendations:**
  - Personalized playlists based on detected emotions
  - Spotify API integration (optional)
  - Fallback recommendations when API is unavailable

- **Modern UI:**
  - Beautiful gradient design
  - Real-time emotion visualization
  - Responsive layout
  - Smooth animations

## Tech Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **TensorFlow.js** - Facial expression detection
- **MediaPipe** - Face landmarks detection
- **Web Audio API** - Voice recording and analysis

### Backend
- **Flask** - Python web framework
- **Librosa** - Audio feature extraction
- **scikit-learn** - Machine learning utilities
- **NumPy** - Numerical computations
- **Spotify API** - Music recommendations (optional)

## Installation

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- npm or yarn

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

1. Create a virtual environment:
```bash
cd backend
python -m venv venv
```

2. Activate the virtual environment:
   - Windows:
   ```bash
   venv\Scripts\activate
   ```
   - macOS/Linux:
   ```bash
   source venv/bin/activate
   ```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. (Optional) Set up Spotify API credentials:
   - Create a `.env` file in the `backend` directory:
   ```
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```
   - Get credentials from [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

5. Start the Flask server:
```bash
python app.py
```

The backend will be available at `http://localhost:5000`

## Usage

1. **Start both servers** (frontend and backend)

2. **Choose detection method:**
   - Click "📷 Facial Expression" to use camera
   - Click "🎤 Voice Analysis" to use microphone

3. **Detect emotion:**
   - For facial: Click "Start Detection" and look at the camera
   - For voice: Click "Start Recording" and speak for 5 seconds

4. **View recommendations:**
   - After emotion is detected, personalized music recommendations will appear
   - Click "▶ Play" to open tracks/playlists (if Spotify is configured)

## Project Structure

```
emotion-aware-music-recommender/
├── src/
│   ├── components/
│   │   ├── EmotionDetector.jsx
│   │   ├── FaceEmotionDetector.jsx
│   │   ├── VoiceEmotionDetector.jsx
│   │   └── MusicRecommendations.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── backend/
│   ├── app.py
│   ├── emotion_classifier.py
│   └── music_recommender.py
├── package.json
├── vite.config.js
├── requirements.txt
└── README.md
```

## API Endpoints

### `POST /api/process-emotion`
Process emotion from face or voice detection
- **Body**: `{ "emotion": "happy", "source": "face" }`
- **Response**: `{ "processed_emotion": "happy", "confidence": 0.85 }`

### `POST /api/analyze-voice`
Analyze voice emotion from audio file
- **Body**: FormData with audio file
- **Response**: `{ "emotion": "happy", "confidence": 0.80 }`

### `POST /api/recommend-music`
Get music recommendations based on emotion
- **Body**: `{ "emotion": "happy" }`
- **Response**: `{ "emotion": "happy", "recommendations": [...] }`

### `GET /api/health`
Health check endpoint

## Browser Permissions

The app requires:
- **Camera access** for facial expression detection
- **Microphone access** for voice sentiment analysis

Make sure to grant these permissions when prompted by your browser.

## Development Notes

- The emotion detection uses simplified heuristics. For production, train ML models on emotion datasets.
- Spotify API integration is optional. The app works with fallback recommendations.
- Audio processing uses librosa for feature extraction. For better accuracy, consider training models on emotion-labeled audio datasets.

## Future Enhancements

- [ ] Train custom ML models for better emotion accuracy
- [ ] Add YouTube Music API integration
- [ ] Implement user accounts and preference learning
- [ ] Add emotion history tracking
- [ ] Support for multiple music streaming services
- [ ] Real-time emotion monitoring
- [ ] Playlist creation and export

## License

MIT License - feel free to use this project for learning and development!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
