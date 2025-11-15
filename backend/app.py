from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import numpy as np
from dotenv import load_dotenv
from emotion_classifier import EmotionClassifier
from music_recommender import MusicRecommender

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize classifiers
emotion_classifier = EmotionClassifier()
music_recommender = MusicRecommender()

@app.route('/api/process-emotion', methods=['POST'])
def process_emotion():
    """Process emotion from face or voice detection"""
    try:
        data = request.json
        emotion = data.get('emotion')
        source = data.get('source', 'face')
        
        # Validate and normalize emotion
        valid_emotions = ['happy', 'sad', 'energetic', 'calm', 'stressed', 'neutral']
        emotion = emotion.lower() if emotion else 'neutral'
        
        if emotion not in valid_emotions:
            # Use ML model to classify if emotion is not valid
            emotion = emotion_classifier.classify(emotion)
        
        return jsonify({
            'processed_emotion': emotion,
            'source': source,
            'confidence': 0.85
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-voice', methods=['POST'])
def analyze_voice():
    """Analyze voice emotion from audio file"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        # Save temporary file
        temp_path = 'temp_audio.wav'
        audio_file.save(temp_path)
        
        # Analyze voice emotion
        emotion = emotion_classifier.analyze_voice(temp_path)
        
        # Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return jsonify({
            'emotion': emotion,
            'confidence': 0.80
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recommend-music', methods=['POST'])
def recommend_music():
    """Get music recommendations based on emotion"""
    try:
        data = request.json
        emotion = data.get('emotion', 'neutral')
        
        recommendations = music_recommender.get_recommendations(emotion)
        
        return jsonify({
            'emotion': emotion,
            'recommendations': recommendations
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'emotion-aware-music-recommender'})

@app.route('/', methods=['GET'])
def root():
    """Root endpoint - API information"""
    return jsonify({
        'message': 'Emotion-Aware Music Recommender API',
        'version': '1.0.0',
        'endpoints': {
            'health': '/api/health',
            'process_emotion': '/api/process-emotion (POST)',
            'analyze_voice': '/api/analyze-voice (POST)',
            'recommend_music': '/api/recommend-music (POST)'
        },
        'status': 'running'
    })

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Endpoint not found',
        'message': 'The requested endpoint does not exist. Check /api/health for available endpoints.',
        'available_endpoints': [
            '/api/health',
            '/api/process-emotion',
            '/api/analyze-voice',
            '/api/recommend-music'
        ]
    }), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

