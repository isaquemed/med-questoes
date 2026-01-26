# Sugestões de Código - Melhorias Práticas

Este documento contém exemplos de código prontos para implementar as melhorias recomendadas no projeto Med-Questões.

---

## 1. Code Splitting com React.lazy

### Arquivo: `client/src/App.tsx`

```typescript
import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import ErrorBoundary from '@/components/ErrorBoundary';

// Lazy loading de páginas
const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const Performance = lazy(() => import('@/pages/Performance'));
const ErrorNotebook = lazy(() => import('@/pages/ErrorNotebook'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SkeletonLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/performance" component={Performance} />
          <Route path="/error-notebook" component={ErrorNotebook} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
```

---

## 2. Rate Limiting no Backend

### Instalar dependência:
```bash
pnpm add express-rate-limit
```

### Arquivo: `server/middleware/rateLimiter.ts`

```typescript
import rateLimit from 'express-rate-limit';

// Rate limiter para rotas de autenticação
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por IP
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para API geral
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // 100 requisições por minuto
  message: 'Muitas requisições. Tente novamente em alguns instantes.',
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Uso em `server/index.ts`:

```typescript
import { authLimiter, apiLimiter } from './middleware/rateLimiter.js';

// Aplicar rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);
```

---

## 3. Validação com Zod no Backend

### Arquivo: `server/validators/questionFilters.ts`

```typescript
import { z } from 'zod';

export const questionFiltersSchema = z.object({
  source: z.string().optional(),
  year: z.string().regex(/^\d{4}$|^all$/).optional(),
  specialty: z.string().max(255).optional(),
  topic: z.string().max(255).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(0)).optional(),
});

export const validateQuestionFilters = (data: any) => {
  return questionFiltersSchema.safeParse(data);
};
```

### Uso em `server/routes/questions.ts`:

```typescript
import { validateQuestionFilters } from '../validators/questionFilters.js';

router.get('/', async (req: any, res: any) => {
  try {
    // Validar query params
    const validation = validateQuestionFilters(req.query);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Parâmetros inválidos', 
        details: validation.error.errors 
      });
    }
    
    const { source, year, specialty, topic, limit = 10, offset = 0 } = validation.data;
    
    // Resto do código...
  } catch (error: any) {
    console.error('ERRO NA ROTA /api/questions:', error);
    res.status(500).json({ error: 'Erro ao buscar questões', details: error.message });
  }
});
```

---

## 4. React Query para Cache de API

### Instalar dependência:
```bash
pnpm add @tanstack/react-query
```

### Arquivo: `client/src/main.tsx`

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

### Arquivo: `client/src/hooks/useQuestions.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { questionsApi } from '@/lib/api';

interface QuestionFilters {
  source?: string;
  year?: string;
  specialty?: string;
  topic?: string;
  limit?: number;
  offset?: number;
}

export const useQuestions = (filters: QuestionFilters) => {
  return useQuery({
    queryKey: ['questions', filters],
    queryFn: async () => {
      const response = await questionsApi.getQuestions(filters);
      return response.data;
    },
    enabled: !!filters, // Só busca se houver filtros
  });
};

export const useFilters = () => {
  return useQuery({
    queryKey: ['filters'],
    queryFn: async () => {
      const response = await questionsApi.getFilters();
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutos (filtros mudam raramente)
  });
};
```

### Uso em `client/src/pages/Home.tsx`:

```typescript
import { useQuestions, useFilters } from '@/hooks/useQuestions';

export default function Home() {
  const [filters, setFilters] = useState(initialFilters);
  
  // Substituir fetchFilters por:
  const { data: availableFilters, isLoading: filtersLoading } = useFilters();
  
  // Substituir handleStartQuiz por:
  const { data: questionsData, isLoading: questionsLoading, refetch } = useQuestions(filters);
  
  const handleStartQuiz = async () => {
    const result = await refetch();
    if (result.data?.questions) {
      setQuestions(result.data.questions);
      setPageState('quiz');
    }
  };
  
  // Resto do código...
}
```

---

## 5. Modo Escuro (Dark Mode)

### Arquivo: `client/src/contexts/ThemeContext.tsx`

```typescript
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('medquestoes_theme');
    return (saved as Theme) || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('medquestoes_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### Arquivo: `tailwind.config.js`

```javascript
module.exports = {
  darkMode: 'class', // Habilitar dark mode
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Adicionar cores para dark mode
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // ... outras cores
      },
    },
  },
  plugins: [],
};
```

### Arquivo: `client/src/styles/globals.css`

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... outras variáveis */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... outras variáveis */
  }
}
```

### Componente de Toggle:

```typescript
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full"
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
};
```

---

## 6. Testes Unitários com Vitest

### Arquivo: `client/src/components/__tests__/QuestionCard.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionCard } from '../QuestionCard';

describe('QuestionCard', () => {
  const mockQuestion = {
    id: '1',
    question: 'Qual é a capital do Brasil?',
    alternatives: [
      { letter: 'A', text: 'São Paulo' },
      { letter: 'B', text: 'Rio de Janeiro' },
      { letter: 'C', text: 'Brasília' },
      { letter: 'D', text: 'Salvador' },
    ],
    correctAnswer: 'C',
  };

  it('deve renderizar a questão corretamente', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        onAnswer={vi.fn()}
        disabled={false}
      />
    );

    expect(screen.getByText('Qual é a capital do Brasil?')).toBeInTheDocument();
    expect(screen.getByText('São Paulo')).toBeInTheDocument();
  });

  it('deve chamar onAnswer quando uma alternativa é clicada', () => {
    const onAnswerMock = vi.fn();
    
    render(
      <QuestionCard
        question={mockQuestion}
        onAnswer={onAnswerMock}
        disabled={false}
      />
    );

    const alternativeC = screen.getByText('Brasília');
    fireEvent.click(alternativeC);

    expect(onAnswerMock).toHaveBeenCalledWith('C', true);
  });

  it('deve desabilitar alternativas quando disabled é true', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        onAnswer={vi.fn()}
        disabled={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });
});
```

### Configuração: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./client/src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
});
```

### Arquivo: `client/src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup após cada teste
afterEach(() => {
  cleanup();
});
```

---

## 7. GitHub Actions para CI/CD

### Arquivo: `.github/workflows/ci.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install

      - name: Run TypeScript check
        run: pnpm run check

      - name: Run tests
        run: pnpm test

      - name: Build project
        run: pnpm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to Render
        run: |
          echo "Deploy automático via webhook do Render"
          # Render já detecta o push automaticamente
```

---

## 8. Middleware de Logging Estruturado

### Instalar dependência:
```bash
pnpm add winston
```

### Arquivo: `server/middleware/logger.ts`

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
};

export default logger;
```

### Uso em `server/index.ts`:

```typescript
import { requestLogger } from './middleware/logger.js';
import logger from './middleware/logger.js';

// Substituir console.log por logger
app.use(requestLogger);

// Tratamento de erro global
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Erro não tratado:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  res.status(500).json({ error: 'Erro interno do servidor' });
});
```

---

## 9. Exportação de Caderno de Erros em PDF

### Instalar dependência:
```bash
pnpm add jspdf jspdf-autotable
```

### Arquivo: `client/src/utils/exportPDF.ts`

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ErrorQuestion {
  id: string;
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  specialty: string;
  source: string;
  year: number;
}

export const exportErrorNotebookToPDF = (questions: ErrorQuestion[]) => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(20);
  doc.text('Caderno de Erros - MedQuestões', 14, 20);

  // Data
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

  // Tabela
  autoTable(doc, {
    startY: 35,
    head: [['#', 'Especialidade', 'Fonte', 'Ano', 'Sua Resposta', 'Resposta Correta']],
    body: questions.map((q, index) => [
      (index + 1).toString(),
      q.specialty || '-',
      q.source || '-',
      q.year?.toString() || '-',
      q.selectedAnswer,
      q.correctAnswer,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [0, 43, 92] }, // Azul marinho
    styles: { fontSize: 9 },
  });

  // Salvar
  doc.save(`caderno-de-erros-${new Date().getTime()}.pdf`);
};
```

### Uso em `client/src/pages/ErrorNotebook.tsx`:

```typescript
import { Download } from 'lucide-react';
import { exportErrorNotebookToPDF } from '@/utils/exportPDF';

// Adicionar botão de exportação
<Button
  onClick={() => exportErrorNotebookToPDF(errorQuestions)}
  className="bg-[#002b5c] hover:bg-[#001a3a]"
>
  <Download size={16} className="mr-2" />
  Exportar PDF
</Button>
```

---

## 10. Service Worker para Modo Offline

### Arquivo: `client/public/sw.js`

```javascript
const CACHE_NAME = 'medquestoes-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
];

// Instalação
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Ativação
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - retornar resposta do cache
      if (response) {
        return response;
      }

      // Clonar request
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Verificar se é uma resposta válida
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clonar response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
```

### Registro em `client/src/main.tsx`:

```typescript
// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registrado:', registration);
      })
      .catch((error) => {
        console.log('Erro ao registrar SW:', error);
      });
  });
}
```

---

## Conclusão

Estas sugestões de código são prontas para implementação e seguem as melhores práticas de desenvolvimento web moderno. Cada seção pode ser implementada de forma independente, permitindo melhorias incrementais no projeto.

**Prioridade de Implementação:**
1. Rate Limiting (segurança)
2. Code Splitting (performance)
3. Validação com Zod (segurança)
4. React Query (performance e UX)
5. Testes Unitários (qualidade)
6. Modo Escuro (UX)
7. GitHub Actions (DevOps)
8. Logging Estruturado (observabilidade)
9. Exportação PDF (funcionalidade)
10. Service Worker (funcionalidade avançada)
