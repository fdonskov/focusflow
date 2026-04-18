# FocusFlow

**Интеллектуальный менеджер задач с LLM-ассистентом.**

Веб-приложение для управления повседневными задачами (To-Do) с интегрированным AI-помощником, который помогает категоризировать задачи, декомпозировать сложные пункты на подзадачи и генерировать сводку рабочей нагрузки.

> 🤖 **Для AI-агентов** (Claude Code, Cursor, Aider и т.д.) — см. [`AGENTS.md`](./AGENTS.md) с машинопонятным сценарием запуска и верификации.

---

## Содержание

1. [Реализованные функции](#реализованные-функции)
2. [Стек](#стек)
3. [Быстрый старт](#быстрый-старт)
   - [Предварительные требования](#предварительные-требования)
   - [Типичные проблемы](#типичные-проблемы)
4. [Сценарий проверки для ревьюера](#сценарий-проверки-для-ревьюера)
5. [Переменные окружения](#переменные-окружения)
6. [Разработка и тестирование](#разработка-и-тестирование)
7. [Архитектура](#архитектура)
8. [API](#api)
9. [LLM-интеграция](#llm-интеграция)
10. [Локализация](#локализация)
11. [Известные ограничения](#известные-ограничения-и-компромиссы)
12. [Что добавил бы при наличии времени](#что-добавил-бы-при-наличии-времени)

---

## Реализованные функции

### Обязательные

| ID | Функция | Статус |
|----|---------|--------|
| US-1 | CRUD задач (название, описание, приоритет, статус, срок, категория) | ✅ |
| US-2 | Фильтрация по статусу/приоритету + полнотекстовый поиск (комбинируемые, на стороне сервера) | ✅ |

### LLM-функции

| ID | Функция | Статус |
|----|---------|--------|
| US-3 | Умная категоризация задачи по названию и описанию | ✅ |
| US-4 | Декомпозиция задачи на подзадачи | ✅ |
| US-6 | Сводка рабочей нагрузки (естественно-языковой обзор) | ✅ |
| US-5 | Предложение приоритета | ❌ (в планах) |

### Дополнительно
- Локализация интерфейса: **русский / английский** с автоматическим определением языка и переключателем
- Консистентная обработка ошибок (структурированные ответы API + toast-уведомления)
- Пагинация и сортировка
- Debounced-поиск (300 мс)
- Бейджи статуса/приоритета с цветовой индикацией
- Health-check, автоматическое скрытие LLM-блоков при отсутствии ключа
- Swagger/OpenAPI-документация

---

## Стек

### Backend
- **Python 3.11** + **FastAPI** 0.115+
- **SQLAlchemy 2.0** (async) + **asyncpg**
- **Alembic** — миграции
- **Pydantic v2** + **pydantic-settings** — валидация и конфигурация
- **Groq SDK** — LLM-клиент (Llama 3.3 70B)
- **pytest** + **pytest-asyncio** + **httpx** — тесты (CRUD на SQLite in-memory, LLM с моками)
- **aiosqlite** — только для тестов

### Frontend
- **React 18** + **TypeScript 5** + **Vite 5**
- **TanStack Query v5** — кеширование, рефетч, инвалидация
- **React Hook Form** + **Zod** — формы и валидация
- **Tailwind CSS** + **shadcn/ui** (Radix UI) — компоненты
- **i18next** + **react-i18next** — локализация ru/en
- **date-fns** — форматирование дат с локалями
- **sonner** — toast-уведомления
- **lucide-react** — иконки
- **Vitest** + **React Testing Library** — тесты

### Инфраструктура
- **Docker** + **Docker Compose** v2
- **PostgreSQL 16** — основная БД
- Сеть, volume для БД, healthcheck

---

## Быстрый старт

### Предварительные требования

Нужно установить **только одно**: Docker. Всё остальное (Python, Node.js, PostgreSQL, зависимости) ставится автоматически внутри контейнеров.

| ОС | Что установить | Ссылка |
|----|----------------|--------|
| **macOS** | Docker Desktop или OrbStack (легче) | https://www.docker.com/products/docker-desktop/ или https://orbstack.dev |
| **Windows** | Docker Desktop (с WSL2) | https://www.docker.com/products/docker-desktop/ |
| **Linux** | Docker Engine + Docker Compose plugin | https://docs.docker.com/engine/install/ |

**После установки:**
1. Запустите Docker Desktop (иконка в трее/меню-баре должна стать зелёной)
2. Проверьте в терминале:
   ```bash
   docker --version           # Docker version 20+ (рекомендуется 27+)
   docker compose version     # Docker Compose version v2.20+
   ```

**Требования к железу:**
- ~1.5 ГБ свободного места (образы + volume БД)
- 2+ ГБ RAM для контейнеров
- Свободные порты: `5173` (фронт), `8000` (API), `5432` (БД)

**Опционально:**
- `git` — для клонирования репозитория
- `curl` / `jq` — для проверки API из терминала (но можно и через Swagger UI)

### Шаг 1 — клонировать репозиторий
```bash
git clone <url> focusflow && cd focusflow
```

### Шаг 2 — создать `.env`
```bash
cp .env.example .env
```

### Шаг 3 — (опционально) получить LLM-ключ

**LLM-функции опциональны.** Без ключа приложение работает в режиме "только CRUD" — LLM-кнопки и блок сводки автоматически скрываются.

Для активации AI-функций:
1. Зарегистрироваться на https://console.groq.com/keys (бесплатно, без банковской карты, 2 минуты)
2. Создать API-ключ вида `gsk_...`
3. Вставить его в `.env`:
   ```
   GROQ_API_KEY=gsk_...
   ```

Лимит бесплатного плана: ~30 запросов/мин для `llama-3.3-70b-versatile` — хватит с запасом.

### Шаг 4 — запустить
```bash
docker compose up -d --build
```

Первый запуск — ~2 минуты (сборка образов, скачивание зависимостей). Миграции Alembic применяются автоматически.

### Шаг 5 — открыть
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **Swagger UI:** http://localhost:8000/docs
- **PostgreSQL:** localhost:5432 (логин/пароль `focusflow`/`focusflow`)

### Остановить
```bash
docker compose down        # останавливает контейнеры, данные БД сохраняются
docker compose down -v     # + удаляет volume БД
```

### Типичные проблемы

<details>
<summary><b>❌ <code>Cannot connect to the Docker daemon</code></b></summary>

Docker не запущен. Откройте Docker Desktop (или OrbStack) и дождитесь, пока иконка станет зелёной. Проверьте: `docker info` должно отвечать без ошибок.
</details>

<details>
<summary><b>❌ <code>port is already allocated</code> / <code>bind: address already in use</code></b></summary>

Один из портов (5173, 8000 или 5432) уже занят другим процессом.

**Решение А — освободить порт:**
```bash
lsof -i :5173   # посмотреть, что его занимает (macOS/Linux)
kill <PID>
```

**Решение Б — изменить порт** в `.env`:
```
FRONTEND_PORT=5174
BACKEND_PORT=8001
POSTGRES_PORT=5433
VITE_API_URL=http://localhost:8001/api/v1
```
Затем `docker compose up -d --build`.
</details>

<details>
<summary><b>❌ Миграции не применились</b></summary>

Проверьте логи: `docker compose logs backend`. Если видите «Connection refused», БД ещё не готова — compose сам дождётся через healthcheck, но иногда первый запуск требует повтор:
```bash
docker compose restart backend
```
</details>

<details>
<summary><b>❌ Frontend показывает «Нет подключения к серверу»</b></summary>

Backend не отвечает. Проверьте:
```bash
docker compose ps              # backend должен быть Up
curl http://localhost:8000/api/v1/health
```
Если backend упал — смотрите `docker compose logs backend`.
</details>

<details>
<summary><b>❌ После изменения <code>.env</code> ничего не поменялось</b></summary>

Compose читает `.env` только при старте. После правок — перезапустите:
```bash
docker compose down && docker compose up -d
```
</details>

<details>
<summary><b>❌ На Apple Silicon (M1/M2/M3) медленно / ошибки сборки</b></summary>

Все образы проекта нативно поддерживают arm64. Если вдруг что-то не так — пересоберите без кеша:
```bash
docker compose build --no-cache
```
Рекомендую заменить Docker Desktop на **OrbStack** — он в 2–3 раза быстрее на M-чипах.
</details>

<details>
<summary><b>❌ Полная очистка и старт с нуля</b></summary>

Если хочется откатить всё:
```bash
docker compose down -v              # удалить контейнеры + volume БД
docker image rm focusflow-backend focusflow-frontend   # удалить образы
docker compose up -d --build        # собрать и запустить заново
```
</details>

---

## Сценарий проверки для ревьюера

Ручной чеклист (3–5 минут), покрывающий все User Stories из ТЗ.

### Подготовка: автотесты
```bash
docker compose exec backend pytest -v           # 24 теста: CRUD, фильтры, поиск, LLM-сервис
docker compose exec frontend npm test           # 4 теста: бейджи, переключатель языка
docker compose exec frontend npx tsc --noEmit   # проверка типов TypeScript
```

Все должны проходить. Автотесты бэка используют изолированный SQLite in-memory, LLM — мокается.

### US-1: CRUD задач

1. Откройте http://localhost:5173
2. Нажмите **«Создать задачу»**
   - Заполните: название «Подготовить демо», описание «слайды + скрипт», приоритет «Высокий», статус «В работе», срок (любой), категория «работа»
   - **Save** → всплывёт toast «Задача создана», карточка появится в списке
3. Нажмите **карандаш** на созданной задаче → поменяйте статус на «Готово» → **Save** → toast «Задача обновлена», бейдж на карточке обновится
4. Нажмите **корзину** → откроется диалог подтверждения с названием задачи → **Удалить** → toast «Задача удалена»
5. Проверка 404: в Swagger (http://localhost:8000/docs) вызовите `GET /tasks/00000000-0000-0000-0000-000000000000` → `{"detail": "Задача ... не найдена", "code": "not_found"}`

### US-2: Фильтрация и поиск

1. В поле поиска введите «отчёт» → список обновится через 300мс (debounce)
2. Выберите dropdown **«Статус»** → «Ожидает»
3. Выберите dropdown **«Приоритет»** → «Высокий»
4. Проверьте: фильтры **комбинируются** — показаны только задачи `pending + high + содержит «отчёт»`
5. В DevTools → Network увидите запрос `GET /tasks?status=pending&priority=high&search=отчёт&page=1&page_size=20` — фильтрация **на сервере**
6. Кликните на `#работа` на любой карточке → добавится чип `#работа ×` в фильтрах
7. Нажмите **«Сбросить»** — все фильтры очищаются

### Локализация

1. Нажмите переключатель **RU** в правом верхнем углу → выберите **English**
2. Весь UI переведётся: заголовки, кнопки, бейджи статуса/приоритета, даты, сообщения об ошибках
3. Обновите страницу → выбор сохранён в `localStorage`

### Пагинация

1. Создайте 21+ задач (можно быстро через Swagger или скрипт ниже)
2. Внизу списка появятся кнопки **Назад / Вперёд** + «Страница 1 из 2»

```bash
# Быстрый seed тестовых задач
for i in {1..25}; do
  curl -s -X POST http://localhost:8000/api/v1/tasks \
    -H 'Content-Type: application/json' \
    -d "{\"title\":\"Задача $i\",\"priority\":\"medium\"}" > /dev/null
done
```

### Обработка ошибок

1. Остановите backend: `docker compose stop backend`
2. Обновите страницу в браузере → вместо стектрейса увидите сообщение «Нет подключения к серверу»
3. Запустите обратно: `docker compose start backend`

### US-3, US-4, US-6: LLM-функции (только с ключом)

Без `GROQ_API_KEY` в `.env` LLM-блоки **скрыты автоматически** — приложение работает в режиме только CRUD. Это корректное поведение (проверяется через `GET /api/v1/health` → `llm_enabled: false`).

Для активации:
1. Получить ключ на https://console.groq.com/keys (бесплатно, 2 мин)
2. Вставить в `.env`: `GROQ_API_KEY=gsk_...`
3. `docker compose restart backend`

После этого:
1. В форме создания задачи появится блок **«AI»** с двумя кнопками
2. Введите название «Подготовить диссертацию по машинному обучению» → нажмите **«Предложить категорию»** → через ~1 сек появится предложение (например, «учёба») → **Apply** подставит в поле категории
3. Нажмите **«Разбить на подзадачи»** → список из 3–6 пунктов → **Добавить в описание** сформирует нумерованный список в поле описания
4. На главной появится карточка **«Сводка нагрузки»** → **Сгенерировать** → через 1–3 сек появится markdown-текст со статистикой, просрочкой и советами
5. Проверка устойчивости: удалите ключ из `.env` → `restart backend` → запрос в Swagger вернёт 503 со структурированной ошибкой

### Быстрая проверка через API (curl)

```bash
# Health
curl -s http://localhost:8000/api/v1/health | jq

# Создать
curl -s -X POST http://localhost:8000/api/v1/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Тестовая задача","priority":"high"}' | jq

# Список с фильтром
curl -s 'http://localhost:8000/api/v1/tasks?priority=high&page=1&page_size=5' | jq

# 404 с структурированной ошибкой
curl -s http://localhost:8000/api/v1/tasks/00000000-0000-0000-0000-000000000000 | jq
```

---

## Переменные окружения

Все переменные задаются в `.env`. Полный список с дефолтами — в `.env.example`.

| Переменная | Описание | Дефолт |
|------------|----------|--------|
| `POSTGRES_USER` | Пользователь БД | `focusflow` |
| `POSTGRES_PASSWORD` | Пароль БД | `focusflow` |
| `POSTGRES_DB` | Имя БД | `focusflow` |
| `POSTGRES_PORT` | Порт наружу | `5432` |
| `DATABASE_URL` | Async-URL для бэка | `postgresql+asyncpg://focusflow:focusflow@postgres:5432/focusflow` |
| `BACKEND_PORT` | Порт бэка наружу | `8000` |
| `CORS_ORIGINS` | Разрешённые origins (через запятую) | `http://localhost:5173` |
| `GROQ_API_KEY` | LLM-ключ | *(пусто — LLM отключён)* |
| `GROQ_MODEL` | Модель | `llama-3.3-70b-versatile` |
| `FRONTEND_PORT` | Порт фронта | `5173` |
| `VITE_API_URL` | URL API для фронта | `http://localhost:8000/api/v1` |

---

## Разработка и тестирование

### Тесты backend
```bash
docker compose exec backend pytest -v
```
24 теста: CRUD, фильтры, поиск, пагинация, 404/422, LLM-сервис с мок-клиентом.

### Тесты frontend
```bash
docker compose exec frontend npm test
```
Покрытие: локализованные бейджи, переключатель языка.

### Type-check
```bash
docker compose exec frontend npx tsc --noEmit
docker compose exec backend ruff check app
```

### Миграции
```bash
# создать новую миграцию
docker compose exec backend alembic revision --autogenerate -m "описание"

# применить
docker compose exec backend alembic upgrade head

# откатить на шаг
docker compose exec backend alembic downgrade -1
```

### Логи
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

---

## Архитектура

### Backend: чистая слоистая архитектура

```
backend/app/
├── api/              # HTTP-слой: роутеры, DTO-входы, DI-зависимости
│   ├── deps.py       # Annotated[..., Depends(...)] для сессий и сервисов
│   └── v1/
│       ├── router.py # Сборка всех роутеров под /api/v1
│       ├── tasks.py  # CRUD + list с фильтрами
│       └── llm.py    # 3 LLM-эндпоинта
├── core/             # Инфраструктура
│   ├── config.py     # pydantic-settings, чтение .env
│   └── exceptions.py # AppError и обработчик — единый формат ошибок
├── db/               # Слой данных
│   ├── base.py       # SQLAlchemy Base
│   ├── session.py    # async engine + sessionmaker + DI
│   └── models/       # ORM-модели (Task)
├── repositories/     # Data Access — чистый SQL, без бизнес-логики
│   └── task_repo.py  # CRUD + фильтрация
├── services/         # Бизнес-логика — оркестрация, коммиты
│   ├── task_service.py
│   └── llm_service.py
├── schemas/          # Pydantic DTO (валидация, сериализация)
│   ├── task.py
│   ├── common.py     # фильтры, пагинация, сортировка
│   └── llm.py
├── llm/              # Интеграция с Groq
│   ├── client.py     # AsyncGroq обёртка, JSON и text режимы
│   └── prompts.py    # Системные промпты (ru/en)
└── main.py           # FastAPI app factory
```

**Принципы разделения:**
- **api** знает про HTTP, но не про БД и LLM напрямую
- **services** оркестрируют репозитории и LLM-клиент, владеют транзакциями
- **repositories** — только SQL/ORM, принимают и отдают сущности
- **schemas** — граница между внешним API и доменом

### Frontend: feature-based

```
frontend/src/
├── components/ui/    # shadcn/ui примитивы (Button, Dialog, Select…)
├── features/         # Функциональные модули
│   ├── app/          # useHealth
│   ├── tasks/        # CRUD UI + хуки + api
│   ├── filters/      # Фильтры/поиск
│   ├── llm/          # LLM-кнопки + сводка
│   └── i18n/         # Переключатель языка
├── i18n/             # i18next init + locales/ru.json, en.json
├── lib/              # api.ts, utils, date, useDebounced, queryClient
├── types/            # Совместные TS-типы
├── App.tsx
└── main.tsx
```

**Принципы:**
- Один feature = один модуль со своими `api.ts` + `hooks.ts` + компоненты
- Общие примитивы — в `components/ui`
- API-слой инкапсулирован в `features/*/api.ts` — компоненты работают только через хуки
- Все строки проходят через `i18n.t()` — жёстких текстов в коде нет

---

## API

Все эндпоинты под префиксом `/api/v1`. Интерактивная документация — Swagger UI на `/docs`.

### Задачи
| Метод | URL | Описание |
|-------|-----|----------|
| `POST` | `/tasks` | Создать (201) |
| `GET` | `/tasks` | Список с фильтрами и пагинацией |
| `GET` | `/tasks/{id}` | Получить одну (404 если нет) |
| `PATCH` | `/tasks/{id}` | Частичное обновление |
| `DELETE` | `/tasks/{id}` | Удалить (204) |

**Query-параметры списка:** `status`, `priority`, `category`, `search`, `due_before`, `due_after`, `page`, `page_size` (1–100), `sort_by`, `sort_order`.

### LLM
| Метод | URL | Описание |
|-------|-----|----------|
| `POST` | `/llm/categorize` | Предложить категорию |
| `POST` | `/llm/decompose` | Разбить задачу на подзадачи |
| `GET` | `/llm/workload-summary` | Сводка нагрузки (markdown) |

### Формат ошибок (консистентный для всего API)
```json
{
  "detail": "Понятное сообщение",
  "code": "not_found",
  "field": "title"
}
```

| HTTP | Код | Значение |
|------|-----|----------|
| 400 | `validation_error` | Нарушение бизнес-правил |
| 404 | `not_found` | Сущность не найдена |
| 422 | — | Ошибка валидации Pydantic |
| 502 | `llm_error` / `llm_invalid_response` | Ошибка внешнего LLM-провайдера |
| 503 | `llm_not_configured` | LLM не настроен |

Фронтенд маппит `code` в локализованное сообщение (`i18n.t('errors.<code>')`) — добавление нового языка не требует изменений бэка.

---

## LLM-интеграция

### Провайдер
**Groq** (https://groq.com) — провайдер быстрого inference. Модель по умолчанию: `llama-3.3-70b-versatile`. Выбор обусловлен:
- Бесплатный план с достаточным rate limit
- Очень быстрые ответы (< 1 сек)
- Поддержка JSON-mode (`response_format={"type": "json_object"}`)
- OpenAI-совместимое API (легко заменить провайдера при желании)

### Промпт-инжиниринг
Все промпты в `backend/app/llm/prompts.py`. Принципы:
1. **Чёткая роль** в системном промпте («Ты — ассистент-категоризатор задач»)
2. **Явная схема вывода** — JSON для парсабельных ответов, markdown для человекочитаемых
3. **Few-shot примеры категорий** прямо в системном промпте
4. **Языковая переменная** — `system_ru` / `system_en` версии каждого промпта
5. **Ограничение длины** (`max_tokens`) и **низкая температура** (0.2–0.5) для стабильности

### Обработка сбоев LLM
- Невалидный JSON → `LLMError` (502, `llm_invalid_response`)
- Сетевая ошибка/таймаут → `LLMError` (502, `llm_error`)
- Нет ключа → `LLMNotConfiguredError` (503, `llm_not_configured`)
- **Пустые списки подзадач** → отбрасываются, возвращается ошибка
- **Мусорные элементы** в массиве подзадач — фильтруются сервисом (строки-не-объекты, пустые title)

### UX-поддержка асинхронности
- Минимум из ТЗ выполнен: **спиннеры** (Loader2 из lucide) на всех LLM-кнопках
- Пользователь может принять/отклонить предложение (кнопки Apply/Dismiss)
- В случае ошибки — toast с понятным сообщением

### Тестирование без ключа
Все LLM-функции покрыты тестами через `FakeLLMClient` (conftest.py + test_llm_api.py). Это позволяет проверять бизнес-логику (валидация, фильтрация подзадач, формирование промптов) без реальных вызовов Groq.

---

## Локализация

Поддерживаются **русский** (дефолт) и **английский**.

### Как устроено
- `react-i18next` + `i18next-browser-languagedetector`
- Детекция: сначала `localStorage` (ключ `focusflow.lang`), затем `navigator.language`, fallback — `ru`
- Все UI-строки вынесены в `frontend/src/i18n/locales/{ru,en}.json`
- Enum-значения статуса/приоритета переводятся на клиенте: `t('status.pending')`, `t('priority.high')`
- Форматы дат — через `date-fns` с локалью текущего языка
- Коды ошибок бэка → переводы: `t('errors.not_found')`
- LLM-ответы приходят на языке пользователя (параметр `language` в запросе)

### Как добавить язык
1. Создать `src/i18n/locales/de.json` (копия `en.json` с переводом)
2. Добавить `"de"` в `SUPPORTED_LANGUAGES` в `src/i18n/index.ts`
3. Добавить `"language.de": "Deutsch"` в остальные локали
4. Добавить соответствующую локаль из `date-fns` в `src/lib/date.ts`

Бэкенд и схема БД менять не нужно — все технические значения (enum'ы) остаются англоязычными.

---

## Известные ограничения и компромиссы

1. **Full-text поиск через `ILIKE`**, не через PostgreSQL `tsvector`/GIN.
   *Причина:* для рабочей нагрузки теста ILIKE достаточен, проще в коде. При реальном росте данных (>100k задач) стоит перевести на `to_tsvector` + GIN-индекс.

2. **Нет аутентификации/авторизации.**
   ТЗ не требует, задачи принадлежат "всем". При расширении — JWT + `owner_id` на задачах.

3. **SQLite в тестах вместо PostgreSQL.**
   Это компромисс: in-memory SQLite в 50–100 раз быстрее поднимается, поэтому тесты летают. UUID-тип адаптирован через `TypeDecorator` (`conftest.py`). Реальные SQL-фичи PostgreSQL (tsvector, специфичные индексы) в тестах не проверяются.

4. **LLM-вызовы синхронные (без streaming).**
   UI показывает спиннер на всё время запроса (1–3 сек). Streaming был бы улучшением UX для сводки нагрузки, но усложняет код.

5. **Без кеширования LLM-ответов.**
   Каждый запрос "предложить категорию" = запрос в Groq. Идемпотентного ключа нет. При активном использовании разумно кешировать по `(title, description, language)`.

6. **Dev-режим Vite в Docker.**
   Compose поднимает Vite dev-server с HMR. Для production-деплоя нужно собрать статику (`npm run build`) и отдавать через nginx.

7. **Нет CI/CD и линтеров в pre-commit.**
   Локально — `ruff` и `tsc --noEmit`. Для реального проекта — GitHub Actions + husky/pre-commit.

8. **Минимум тестов на фронте** (компоненты badges и переключателя языка). Приоритет был на backend-логику. E2E тесты (Playwright/Cypress) не добавлял.

9. **`docker-compose.yml` без prod-варианта.**
   Один файл для dev. Для прода нужен отдельный `docker-compose.prod.yml` с build-образами (не bind-mount), nginx, secrets.

---

## Возможные доработки

1. **US-5: LLM-предложение приоритета** на основе описания и срока (уже есть инфраструктура, нужен только сервис-метод + кнопка)
2. **Теги** как полноценная сущность (many-to-many) вместо строкового поля `category`
3. **Streaming сводки нагрузки** — прогрессивный рендер markdown
4. **Кеш LLM-ответов** с ключом `sha256(title+description+language)` (Redis или in-memory LRU)
5. **История задач** (audit log) — когда и как менялись поля
6. **Drag & drop** для смены статуса на канбан-доске
7. **Kanban-view** как альтернатива списку (три колонки: ожидает / в работе / готово)
8. **Авторизация** (JWT) + изоляция задач по пользователю
9. **E2E-тесты** (Playwright): сценарий создать → отфильтровать → обновить → удалить
10. **CI pipeline** (GitHub Actions): lint + type-check + тесты на каждый PR
11. **Prod-сборка фронта** в multi-stage Dockerfile + nginx
12. **Экспорт задач** в CSV/JSON, импорт
13. **Уведомления** о приближающихся сроках (cron-задача на бэке)
14. **Больше языков** (немецкий, китайский — инфраструктура готова)
15. **Production-readiness**: structured logging (JSON), OpenTelemetry, prometheus-метрики
