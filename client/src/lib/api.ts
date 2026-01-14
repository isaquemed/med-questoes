import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratamento global de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'Ocorreu um erro inesperado';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export const questionsApi = {
  getFilters: (params?: any) => api.get('/filters', { params }),
  getQuestions: (params?: any) => api.get('/questions', { params }),
  generateResolution: (questionId: string, questionText: string) => 
    api.post('/resolutions/generate', { questionId, questionText }),
};

export default api;
