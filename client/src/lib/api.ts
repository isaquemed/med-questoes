import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'Ocorreu um erro inesperado';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

// API para questões
export const questionsApi = {
  /**
   * Busca filtros disponíveis
   * Se specialty for especificado, busca apenas tópicos daquela especialidade
   */
  getFilters: async (params?: { specialty?: string }) => {
    try {
      // Se há uma especialidade específica, usa o endpoint filtrado
      if (params?.specialty && params.specialty !== 'all') {
        const response = await api.get(`/filtered-topics?specialty=${params.specialty}`);
        // Retorna no mesmo formato esperado pelo frontend
        return { data: { topics: response.data.topics || [] } };
      }
      
      // Caso contrário, busca todos os filtros
      const response = await api.get('/filters');
      return response;
    } catch (error) {
      console.error('Error fetching filters:', error);
      throw error;
    }
  },

  /**
   * Busca questões com filtros
   */
  getQuestions: (params?: any) => api.get('/questions', { params }),

  /**
   * Gera resolução para uma questão
   */
  generateResolution: (questionId: string, questionText: string) => 
    api.post('/resolutions/generate', { questionId, questionText }),
};

export default api;