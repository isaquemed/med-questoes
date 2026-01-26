import { useQuery } from '@tanstack/react-query';
import { questionsApi } from '@/lib/api';

interface QuestionFilters {
  source?: string;
  year?: string;
  specialty?: string;
  topic?: string;
  limit?: string | number;
  offset?: string | number;
}

export const useQuestions = (filters: QuestionFilters, enabled = false) => {
  return useQuery({
    queryKey: ['questions', filters],
    queryFn: async () => {
      const response = await questionsApi.getQuestions(filters);
      return response.data || response;
    },
    enabled: enabled,
  });
};

export const useFilters = () => {
  return useQuery({
    queryKey: ['filters'],
    queryFn: async () => {
      const response = await questionsApi.getFilters();
      return response.data || response;
    },
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
};
