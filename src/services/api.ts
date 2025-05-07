import axios from 'axios';

// Define the base URL for API requests
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Define types for our API responses
export interface Creation {
  id: string;
  title: string;
  date: string;
  key: string;
  genre: string;
  mood: string;
  duration: string;
  instruments: string[];
  imageUrl: string;
  audioUrl: string;
}

export interface GenerationParams {
  key: string;
  instruments: string[];
  mood: string;
  genre: string;
  chords?: string;
  tempo: number;
  duration: number;
}

export interface GenerationResponse {
  message: string;
  creation: Creation;
}

// Initialize axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service object
const apiService = {
  // Get all creations
  getAllCreations: async (): Promise<Creation[]> => {
    try {
      const response = await api.get<Creation[]>('/creations');
      return response.data;
    } catch (error) {
      console.error('Error fetching creations:', error);
      throw error;
    }
  },

  // Get a single creation by ID
  getCreation: async (id: string): Promise<Creation> => {
    try {
      const response = await api.get<Creation>(`/creations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching creation ${id}:`, error);
      throw error;
    }
  },

  // Generate new music
  generateMusic: async (params: GenerationParams): Promise<GenerationResponse> => {
    try {
      const response = await api.post<GenerationResponse>('/generate', params);
      return response.data;
    } catch (error) {
      console.error('Error generating music:', error);
      throw error;
    }
  },

  // Delete a creation
  deleteCreation: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete<{ message: string }>(`/creations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting creation ${id}:`, error);
      throw error;
    }
  },
};

export default apiService; 