# FocusFlow — Интеллектуальный менеджер задач

Веб-приложение для управления задачами (To-Do) с интегрированным LLM-ассистентом. Тестовое задание.

## Технологический стек

### Backend
- **Python 3.11+** + **FastAPI** — REST API
- **SQLAlchemy 2.0** (async) — ORM
- **Alembic** — миграции БД
- **Pydantic v2** — валидация и схемы
- **PostgreSQL 16** — основная БД
- **asyncpg** — драйвер PostgreSQL
- **Groq SDK** (OpenAI-совместимое API, Llama 3.3 70B) — основной LLM-провайдер (бесплатный)
- **pytest** + **pytest-asyncio** + **httpx** — тесты (репозитории, API, LLM с моками)

### Frontend
- **React 18** + **TypeScript**
- **Vite** — сборщик
- **TanStack Query (React Query)** — работа с API и кешем
- **React Hook Form** + **Zod** — формы и валидация
- **Tailwind CSS** — стили
- **shadcn/ui** — UI-компоненты (Button, Dialog, Input, Select, Toast и т.д.)
- **axios** — HTTP-клиент
- **Vitest** + **React Testing Library** — тесты

### Инфраструктура
- **Docker** + **Docker Compose** — локальный запуск всех сервисов
- **.env** — переменные окружения

## Реализуемый функционал

### Обязательный (US-1, US-2)
- **CRUD задач**: название, описание, приоритет (low/medium/high), статус (pending/in_progress/done), срок выполнения, время создания
- **Фильтрация** по статусу и приоритету (комбинируемая, на стороне сервера)
- **Полнотекстовый поиск** по названию и описанию
- **UI**: форма создания/редактирования, список задач, диалог подтверждения удаления

### LLM-функции (планируем реализовать)
- **US-3: Умная категоризация** — LLM предлагает категорию/тег по названию и описанию
- **US-4: Декомпозиция задачи** — LLM разбивает сложную задачу на подзадачи
- **US-6: Сводка нагрузки** — LLM генерирует естественно-языковую сводку текущей рабочей нагрузки (просроченные задачи, ближайшие сроки)

US-5 (предложение приоритета) — опционально, если останется время.

## Архитектура

### Backend (Clean Architecture / слоистая)
```
backend/
├── app/
│   ├── api/              # HTTP-слой (FastAPI routers, DTO)
│   │   ├── v1/
│   │   │   ├── tasks.py
│   │   │   └── llm.py
│   │   └── deps.py       # DI-зависимости
│   ├── core/             # Конфигурация, настройки, логирование
│   │   ├── config.py
│   │   └── exceptions.py
│   ├── db/               # Слой данных
│   │   ├── base.py       # SQLAlchemy Base
│   │   ├── session.py    # AsyncSession factory
│   │   └── models/       # ORM-модели
│   │       └── task.py
│   ├── repositories/     # Репозитории (абстракция над БД)
│   │   └── task_repo.py
│   ├── services/         # Бизнес-логика
│   │   ├── task_service.py
│   │   └── llm_service.py
│   ├── schemas/          # Pydantic-схемы (DTO)
│   │   ├── task.py
│   │   └── llm.py
│   ├── llm/              # LLM-интеграция
│   │   ├── client.py     # Groq клиент
│   │   └── prompts.py    # Промпты
│   └── main.py           # Точка входа FastAPI
├── alembic/              # Миграции
├── tests/
├── pyproject.toml
└── Dockerfile
```

### Frontend (feature-based)
```
frontend/
├── src/
│   ├── api/              # HTTP-клиент, типы ответов
│   │   └── tasks.ts
│   ├── components/       # Переиспользуемые UI-компоненты
│   │   └── ui/           # shadcn/ui примитивы
│   ├── features/
│   │   ├── tasks/        # CRUD, список, форма
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskForm.tsx
│   │   │   ├── TaskItem.tsx
│   │   │   └── hooks/    # useTasks, useCreateTask...
│   │   ├── filters/      # Фильтры и поиск
│   │   └── llm/          # LLM-кнопки и результаты
│   ├── lib/              # Утилиты, queryClient
│   ├── types/            # Общие TypeScript типы
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── Dockerfile
```

### Docker Compose
- **postgres** — БД
- **backend** — FastAPI на 8000
- **frontend** — Vite dev-server на 5173 (в prod — nginx со сбилженными статикой)

## Ключевые решения

### API
- REST под `/api/v1/*`
- Консистентные коды ответов: 200/201/204/400/404/422/500
- Единый формат ошибок: `{ "detail": "...", "code": "...", "field": "..." }`
- OpenAPI-документация на `/docs`

### БД
- UUID как primary key для задач
- Индексы на `status`, `priority`, `due_date`, `created_at`
- Полнотекстовый поиск через `tsvector` PostgreSQL или ILIKE (в зависимости от нагрузки)
- Миграции через Alembic

### LLM
- Системный промпт определяет роль и формат ответа
- Вывод в JSON для структурированных ответов (категоризация, декомпозиция, приоритет)
- Markdown-текст для сводки нагрузки
- Обработка невалидных ответов LLM (повтор/fallback)
- Индикаторы загрузки в UI (spinner/skeleton)
- Опционально: streaming для сводки нагрузки

### Обработка ошибок
- Backend: кастомные исключения → единый `exception_handler`
- Frontend: ErrorBoundary + toast-уведомления через TanStack Query `onError`

## Структура проекта (корень)
```
FocusFlow/
├── backend/
├── frontend/
├── docker-compose.yml
├── docker-compose.override.yml   # для dev
├── .env.example
├── .gitignore
├── README.md                      # инструкции запуска
└── CLAUDE.md                      # этот файл
```

## Команды разработки

_Будут добавлены по мере реализации._

### Предварительно
```bash
# Запуск всех сервисов
docker compose up -d

# Миграции
docker compose exec backend alembic upgrade head

# Бэкенд-логи
docker compose logs -f backend

# Тесты бэка
docker compose exec backend pytest

# Фронт — dev локально (вне docker) если удобнее
cd frontend && npm install && npm run dev
```

## Переменные окружения

```
# backend
DATABASE_URL=postgresql+asyncpg://focusflow:focusflow@postgres:5432/focusflow
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
CORS_ORIGINS=http://localhost:5173

# frontend
VITE_API_URL=http://localhost:8000/api/v1
```

## План работы

1. ✅ Анализ ТЗ, выбор стека, CLAUDE.md
2. Инициализация структуры проекта (backend + frontend + docker-compose)
3. Backend: модели, миграции, репозитории, сервисы, API CRUD
4. Backend: фильтрация и поиск
5. Frontend: базовый UI, список задач, формы
6. Frontend: фильтры и поиск
7. Backend: LLM-интеграция (категоризация, декомпозиция, сводка)
8. Frontend: LLM-кнопки и UI для предложений
9. Обработка ошибок, loading-состояния, polishing
10. README, документация, финальная проверка через Docker Compose
