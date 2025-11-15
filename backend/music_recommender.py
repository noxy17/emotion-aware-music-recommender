import os
import requests
from typing import List, Dict

class MusicRecommender:
    """Recommend music based on detected emotions"""
    
    def __init__(self):
        self.spotify_client_id = os.getenv('SPOTIFY_CLIENT_ID', '')
        self.spotify_client_secret = os.getenv('SPOTIFY_CLIENT_SECRET', '')
        self.spotify_token = None
        
        # Emotion to music mapping
        self.emotion_mapping = {
            'happy': {
                'genres': ['pop', 'dance', 'indie-pop', 'happy'],
                'mood': 'upbeat',
                'energy': 'high',
                'valence': 'positive'
            },
            'sad': {
                'genres': ['indie', 'acoustic', 'sad', 'ballad'],
                'mood': 'melancholic',
                'energy': 'low',
                'valence': 'negative'
            },
            'energetic': {
                'genres': ['rock', 'electronic', 'hip-hop', 'workout'],
                'mood': 'energetic',
                'energy': 'very-high',
                'valence': 'positive'
            },
            'calm': {
                'genres': ['ambient', 'classical', 'meditation', 'chill'],
                'mood': 'peaceful',
                'energy': 'low',
                'valence': 'neutral'
            },
            'stressed': {
                'genres': ['ambient', 'nature-sounds', 'meditation', 'zen'],
                'mood': 'relaxing',
                'energy': 'very-low',
                'valence': 'neutral'
            },
            'neutral': {
                'genres': ['indie', 'pop', 'chill', 'easy-listening'],
                'mood': 'neutral',
                'energy': 'medium',
                'valence': 'neutral'
            }
        }
    
    def get_spotify_token(self):
        """Get Spotify API access token"""
        if not self.spotify_client_id or not self.spotify_client_secret:
            return None
        
        try:
            auth_url = 'https://accounts.spotify.com/api/token'
            auth_response = requests.post(
                auth_url,
                {
                    'grant_type': 'client_credentials',
                    'client_id': self.spotify_client_id,
                    'client_secret': self.spotify_client_secret,
                },
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            if auth_response.status_code == 200:
                self.spotify_token = auth_response.json()['access_token']
                return self.spotify_token
        except Exception as e:
            print(f"Error getting Spotify token: {e}")
        
        return None
    
    def search_spotify(self, query: str, limit: int = 10):
        """Search Spotify for tracks/playlists"""
        if not self.spotify_token:
            self.get_spotify_token()
        
        if not self.spotify_token:
            return []
        
        try:
            search_url = 'https://api.spotify.com/v1/search'
            headers = {'Authorization': f'Bearer {self.spotify_token}'}
            params = {
                'q': query,
                'type': 'playlist,track',
                'limit': limit
            }
            
            response = requests.get(search_url, headers=headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                results = []
                
                # Process playlists
                if 'playlists' in data and 'items' in data['playlists']:
                    for item in data['playlists']['items']:
                        results.append({
                            'name': item['name'],
                            'artist': item.get('owner', {}).get('display_name', 'Spotify'),
                            'url': item['external_urls']['spotify'],
                            'type': 'playlist',
                            'image': item.get('images', [{}])[0].get('url', '')
                        })
                
                # Process tracks
                if 'tracks' in data and 'items' in data['tracks']:
                    for item in data['tracks']['items']:
                        artist_name = ', '.join([a['name'] for a in item['artists']])
                        results.append({
                            'name': item['name'],
                            'artist': artist_name,
                            'url': item['external_urls']['spotify'],
                            'type': 'track',
                            'image': item['album'].get('images', [{}])[0].get('url', '')
                        })
                
                return results[:limit]
        except Exception as e:
            print(f"Error searching Spotify: {e}")
        
        return []
    
    def get_recommendations(self, emotion: str) -> List[Dict]:
        """Get music recommendations for a given emotion"""
        emotion = emotion.lower()
        
        if emotion not in self.emotion_mapping:
            emotion = 'neutral'
        
        mapping = self.emotion_mapping[emotion]
        recommendations = []
        
        # Try to get recommendations from Spotify
        if self.spotify_client_id and self.spotify_client_secret:
            for genre in mapping['genres'][:2]:  # Try first 2 genres
                spotify_results = self.search_spotify(f"genre:{genre} {mapping['mood']}", limit=5)
                recommendations.extend(spotify_results)
                if len(recommendations) >= 10:
                    break
        
        # If no Spotify results, use fallback recommendations
        if not recommendations:
            recommendations = self.get_fallback_recommendations(emotion)
        
        return recommendations[:10]  # Return max 10 recommendations
    
    def get_fallback_recommendations(self, emotion: str) -> List[Dict]:
        """Fallback recommendations when API is not available"""
        fallback = {
            'happy': [
                {'name': 'Happy Hits 2024', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Upbeat Pop Mix', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Feel Good Music', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Dance Party', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Sunny Day Vibes', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'}
            ],
            'sad': [
                {'name': 'Melancholic Melodies', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Emotional Ballads', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Reflective Tunes', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Rainy Day Music', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Heartbreak Songs', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'}
            ],
            'energetic': [
                {'name': 'High Energy Workout', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Power Anthems', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Energetic Beats', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Pump Up Music', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Workout Motivation', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'}
            ],
            'calm': [
                {'name': 'Peaceful Sounds', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Meditation Music', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Relaxing Vibes', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Calm Instrumentals', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Zen Garden', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'}
            ],
            'stressed': [
                {'name': 'Stress Relief', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Calming Nature Sounds', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Zen Music', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Anxiety Relief', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Peaceful Meditation', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'}
            ],
            'neutral': [
                {'name': 'Chill Vibes', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Background Music', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Easy Listening', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Indie Mix', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'},
                {'name': 'Casual Listening', 'artist': 'Various Artists', 'url': '#', 'type': 'playlist'}
            ]
        }
        
        return fallback.get(emotion, fallback['neutral'])

