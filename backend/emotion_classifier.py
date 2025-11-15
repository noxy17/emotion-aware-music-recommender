import numpy as np
import librosa
from sklearn.preprocessing import StandardScaler
import os

class EmotionClassifier:
    """Classify emotions from voice and facial expressions"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.emotions = ['happy', 'sad', 'energetic', 'calm', 'stressed', 'neutral']
        # In production, load a trained model here
        # self.model = load_model('emotion_model.h5')
    
    def classify(self, input_data):
        """
        Classify emotion from input data
        In production, this would use a trained ML model
        """
        # Simplified classification - in production use trained model
        if isinstance(input_data, str):
            # Simple keyword-based fallback
            input_lower = input_data.lower()
            if 'happy' in input_lower or 'joy' in input_lower:
                return 'happy'
            elif 'sad' in input_lower or 'depress' in input_lower:
                return 'sad'
            elif 'energetic' in input_lower or 'excite' in input_lower:
                return 'energetic'
            elif 'calm' in input_lower or 'peace' in input_lower:
                return 'calm'
            elif 'stress' in input_lower or 'anxious' in input_lower:
                return 'stressed'
        
        # Default to neutral
        return 'neutral'
    
    def analyze_voice(self, audio_path):
        """
        Analyze voice emotion from audio file
        Extracts features and classifies emotion
        """
        try:
            # Load audio file
            y, sr = librosa.load(audio_path, duration=5.0)
            
            # Extract audio features
            features = self.extract_audio_features(y, sr)
            
            # Classify emotion based on features
            emotion = self.classify_from_features(features)
            
            return emotion
        except Exception as e:
            print(f"Error analyzing voice: {e}")
            return 'neutral'
    
    def extract_audio_features(self, y, sr):
        """Extract relevant audio features for emotion classification"""
        features = {}
        
        # Zero crossing rate (indicates energy)
        features['zcr'] = np.mean(librosa.feature.zero_crossing_rate(y)[0])
        
        # Spectral centroid (brightness)
        features['spectral_centroid'] = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)[0])
        
        # Spectral rolloff
        features['spectral_rolloff'] = np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr)[0])
        
        # MFCC features (mel-frequency cepstral coefficients)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        for i in range(13):
            features[f'mfcc_{i}'] = np.mean(mfccs[i])
        
        # Tempo (BPM)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        features['tempo'] = tempo
        
        # Energy
        features['energy'] = np.sum(y**2) / len(y)
        
        return features
    
    def classify_from_features(self, features):
        """
        Classify emotion from audio features
        In production, this would use a trained classifier
        """
        # Simplified rule-based classification
        # In production, use a trained ML model (SVM, Random Forest, or Neural Network)
        
        zcr = features.get('zcr', 0)
        energy = features.get('energy', 0)
        tempo = features.get('tempo', 120)
        spectral_centroid = features.get('spectral_centroid', 2000)
        
        # High energy + high tempo = energetic
        if energy > 0.1 and tempo > 140:
            return 'energetic'
        
        # Low energy + low tempo = calm or sad
        if energy < 0.05 and tempo < 80:
            if spectral_centroid < 1500:
                return 'sad'
            else:
                return 'calm'
        
        # High ZCR + high energy = happy
        if zcr > 0.1 and energy > 0.08:
            return 'happy'
        
        # Low spectral centroid = stressed or sad
        if spectral_centroid < 1000:
            return 'stressed'
        
        # Default
        return 'neutral'

