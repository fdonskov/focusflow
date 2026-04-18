# AGENTS.md — Инструкция для AI-агента

> Этот файл предназначен для AI-агентов (Claude Code, Cursor, Aider, Copilot Workspace и т.д.) и описывает **полный автономный сценарий запуска и проверки проекта**. Все команды неинтерактивные. Каждый шаг имеет ожидаемый вывод для верификации.
>
> **Не требует ввода от пользователя. Не задаёт вопросов.**

## Цель

Проверить, что проект **FocusFlow** (интеллектуальный менеджер задач):
1. Собирается из исходников без ошибок
2. Поднимается одной командой
3. Все автотесты проходят
4. API и UI отвечают корректно
5. Соответствует требованиям ТЗ (US-1, US-2 обязательные; US-3, US-4, US-6 LLM опциональные)

## Предварительные проверки

Выполнить последовательно. Если команда выдаёт ошибку — записать и перейти к разделу [Восстановление](#восстановление).

```bash
# 1. Docker установлен и работает
docker --version
# Ожидается: "Docker version XX.Y.Z..."
docker info --format '{{.ServerVersion}}'
# Ожидается: версия без ошибок. Если "Cannot connect to the Docker daemon" — запустить Docker Desktop/OrbStack и повторить.

# 2. Docker Compose v2 доступен
docker compose version
# Ожидается: "Docker Compose version v2.20+"

# 3. Рабочая директория — корень проекта
ls docker-compose.yml README.md CLAUDE.md
# Ожидается: все три файла существуют
```

## Запуск проекта

```bash
# 1. Создать .env из шаблона (если ещё нет)
test -f .env || cp .env.example .env

# 2. Собрать и поднять все сервисы
docker compose up -d --build
# Ожидаемое время: 1-3 минуты на первом запуске, 10 секунд на последующих
# Ожидается в выводе: "Container focusflow-postgres Started", "focusflow-backend Started", "focusflow-frontend Started"

# 3. Дождаться готовности (БД healthcheck + миграции)
sleep 15

# 4. Проверить, что все 3 контейнера запущены
docker compose ps --format 'table {{.Name}}\t{{.Status}}'
# Ожидается:
#   focusflow-backend    Up
#   focusflow-frontend   Up
#   focusflow-postgres   Up (healthy)
```

## Проверка автотестов

```bash
# 1. Backend-тесты (pytest)
docker compose exec -T backend pytest -v
# Ожидается: "24 passed" (или больше), exit code 0
# Проверяемое:
#   - CRUD задач (6 тестов)
#   - Фильтрация по статусу/приоритету/категории (3 теста)
#   - Поиск по названию/описанию (1 тест)
#   - Диапазон дат (1 тест)
#   - Пагинация (1 тест)
#   - Валидация (1 тест)
#   - LLM с мок-клиентом (10 тестов)
#   - Health (2 теста)

# 2. Frontend-тесты (Vitest)
docker compose exec -T frontend npm test
# Ожидается: "Tests 4 passed (4)", exit code 0

# 3. TypeScript-компиляция
docker compose exec -T frontend npx tsc --noEmit
# Ожидается: пустой вывод, exit code 0
```

## Проверка HTTP-эндпоинтов

### Health-check
```bash
curl -s http://localhost:8000/api/v1/health
# Ожидается JSON: {"status":"ok","llm_enabled":false}
# Примечание: "llm_enabled" = true только если задан GROQ_API_KEY
```

### Frontend доступен
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/
# Ожидается: 200
```

### Swagger UI
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs
# Ожидается: 200
```

## Функциональные проверки API

Выполнить в указанном порядке (результаты используются в следующих шагах).

### US-1: CRUD задач

```bash
# 1. Создать задачу — POST /tasks → 201
TASK=$(curl -s -X POST http://localhost:8000/api/v1/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"AI check task","description":"check","priority":"high","status":"in_progress","category":"работа","due_date":"2026-04-25"}')
echo "$TASK"
# Ожидается: JSON с id (UUID), created_at, updated_at, все поля запроса

TASK_ID=$(echo "$TASK" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')
test -n "$TASK_ID" || echo "FAIL: no id returned"

# 2. Получить по id — GET /tasks/{id} → 200
curl -s "http://localhost:8000/api/v1/tasks/$TASK_ID" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d["id"]=="'$TASK_ID'"; print("OK")'
# Ожидается: OK

# 3. Обновить — PATCH /tasks/{id} → 200
UPDATED=$(curl -s -X PATCH "http://localhost:8000/api/v1/tasks/$TASK_ID" \
  -H 'Content-Type: application/json' -d '{"status":"done"}')
echo "$UPDATED" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d["status"]=="done"; print("OK")'
# Ожидается: OK

# 4. Удалить — DELETE /tasks/{id} → 204
curl -s -o /dev/null -w "%{http_code}" -X DELETE "http://localhost:8000/api/v1/tasks/$TASK_ID"
# Ожидается: 204

# 5. 404 на удалённую задачу
curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api/v1/tasks/$TASK_ID"
# Ожидается: 404

# 6. Структурированная ошибка 404
curl -s "http://localhost:8000/api/v1/tasks/00000000-0000-0000-0000-000000000000" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d["code"]=="not_found"; print("OK")'
# Ожидается: OK

# 7. Валидация: пустое название → 422
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v1/tasks \
  -H 'Content-Type: application/json' -d '{"title":"   "}'
# Ожидается: 422
```

### US-2: Фильтрация и поиск

```bash
# Подготовка: засеять несколько задач
for data in \
  '{"title":"Отчёт Q1","priority":"high","status":"pending","category":"работа"}' \
  '{"title":"Отчёт Q2","priority":"high","status":"done","category":"работа"}' \
  '{"title":"Купить хлеб","priority":"low","status":"pending","category":"дом"}' \
  '{"title":"Учёба Python","priority":"medium","status":"in_progress","category":"учёба"}'; do
  curl -s -X POST http://localhost:8000/api/v1/tasks -H 'Content-Type: application/json' -d "$data" > /dev/null
done

# 1. Фильтр по статусу
curl -s 'http://localhost:8000/api/v1/tasks?status=pending' | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d["total"]>=2; print(f"pending: {d[\"total\"]}")'

# 2. Фильтр по приоритету
curl -s 'http://localhost:8000/api/v1/tasks?priority=high' | python3 -c 'import sys,json; d=json.load(sys.stdin); print(f"high: {d[\"total\"]}")'

# 3. Комбинированный фильтр (статус + приоритет)
curl -s 'http://localhost:8000/api/v1/tasks?status=pending&priority=high' | python3 -c 'import sys,json; d=json.load(sys.stdin); print(f"pending+high: {d[\"total\"]}")'
# Ожидается: меньше, чем каждый по отдельности

# 4. Поиск по названию (русский текст)
python3 -c "
import urllib.request, urllib.parse, json
url = 'http://localhost:8000/api/v1/tasks?' + urllib.parse.urlencode({'search': 'отчёт'})
d = json.loads(urllib.request.urlopen(url).read())
print(f'search=отчёт: {d[\"total\"]}')
assert d['total'] >= 2
"

# 5. Фильтр по категории (хештег)
python3 -c "
import urllib.request, urllib.parse, json
url = 'http://localhost:8000/api/v1/tasks?' + urllib.parse.urlencode({'category': 'работа'})
d = json.loads(urllib.request.urlopen(url).read())
print(f'category=работа: {d[\"total\"]}')
assert d['total'] >= 2
"

# 6. Пагинация
curl -s 'http://localhost:8000/api/v1/tasks?page=1&page_size=2' | python3 -c 'import sys,json; d=json.load(sys.stdin); assert len(d["items"])<=2 and d["page"]==1; print("pagination OK")'

# 7. Сортировка
curl -s 'http://localhost:8000/api/v1/tasks?sort_by=created_at&sort_order=asc&page_size=1' | python3 -c 'import sys,json; d=json.load(sys.stdin); print(f"first by created_at asc: {d[\"items\"][0][\"title\"] if d[\"items\"] else \"(empty)\"}")'
```

### US-3, US-4, US-6: LLM (только если задан GROQ_API_KEY)

```bash
LLM_ENABLED=$(curl -s http://localhost:8000/api/v1/health | python3 -c 'import sys,json; print(json.load(sys.stdin).get("llm_enabled"))')

if [ "$LLM_ENABLED" = "True" ]; then
    echo "LLM enabled — проверяю эндпоинты"

    # US-3: категоризация
    curl -s -X POST http://localhost:8000/api/v1/llm/categorize \
      -H 'Content-Type: application/json' \
      -d '{"title":"Подготовить диссертацию","description":"по машинному обучению","language":"ru"}' | python3 -c 'import sys,json; d=json.load(sys.stdin); assert "category" in d and d["category"]; print(f"category: {d[\"category\"]}")'

    # US-4: декомпозиция
    curl -s -X POST http://localhost:8000/api/v1/llm/decompose \
      -H 'Content-Type: application/json' \
      -d '{"title":"Сделать сайт-портфолио","description":"с секциями обо мне и контактами","language":"ru"}' | python3 -c 'import sys,json; d=json.load(sys.stdin); assert len(d["subtasks"])>=1; print(f"subtasks: {len(d[\"subtasks\"])}")'

    # US-6: сводка нагрузки
    curl -s 'http://localhost:8000/api/v1/llm/workload-summary?language=ru' | python3 -c 'import sys,json; d=json.load(sys.stdin); print(f"summary length: {len(d[\"summary\"])}, task_count: {d[\"task_count\"]}")'
else
    echo "LLM отключён (нет GROQ_API_KEY) — проверяю, что эндпоинты корректно возвращают 503"

    # Должен вернуть 503 с кодом llm_not_configured
    curl -s -X POST http://localhost:8000/api/v1/llm/categorize \
      -H 'Content-Type: application/json' \
      -d '{"title":"x","language":"ru"}' | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d["code"]=="llm_not_configured"; print("LLM 503 OK")'
fi
```

## Критерии успеха

Проект проходит приёмку если **все пункты выполнены**:

- [ ] `docker compose ps` показывает 3 контейнера в статусе `Up` (postgres дополнительно `healthy`)
- [ ] `pytest` — 24+ тестов, все passed
- [ ] `npm test` — 4+ тестов, все passed
- [ ] `tsc --noEmit` — без ошибок
- [ ] `GET /api/v1/health` — HTTP 200, JSON с `status: ok`
- [ ] `GET /` на `localhost:5173` — HTTP 200 (Vite dev-server)
- [ ] `GET /docs` — HTTP 200 (Swagger UI)
- [ ] CRUD задач: POST 201 → GET 200 → PATCH 200 → DELETE 204 → GET 404
- [ ] Фильтрация: status, priority, category, search работают и комбинируются
- [ ] Пагинация: `page` и `page_size` возвращают корректные поля
- [ ] Валидация: пустой title → 422
- [ ] Структурированные ошибки: все ошибки имеют `{"detail", "code"}`
- [ ] LLM endpoints: без ключа — 503 с `llm_not_configured`, с ключом — валидный ответ

## Очистка

```bash
# Остановить контейнеры, удалить volume БД
docker compose down -v

# (опционально) Удалить собранные образы
docker image rm focusflow-backend focusflow-frontend 2>/dev/null || true
```

## Восстановление

При сбое любого шага:

```bash
# Полный ребилд с нуля
docker compose down -v
docker compose build --no-cache
docker compose up -d
sleep 15
docker compose ps
docker compose logs backend 2>&1 | tail -50
docker compose logs frontend 2>&1 | tail -50
```

Типичные причины сбоя:
- **Порт занят** (5173/8000/5432): изменить `FRONTEND_PORT`, `BACKEND_PORT`, `POSTGRES_PORT` в `.env`
- **Нет сети в Docker**: `docker network prune` и повторить `docker compose up`
- **Миграции не применились**: `docker compose exec -T backend alembic upgrade head`
- **Битый volume**: `docker compose down -v` полностью удалит БД

## Структура репозитория

```
focusflow/
├── AGENTS.md            ← этот файл (инструкции для AI)
├── CLAUDE.md            ← архитектурные заметки проекта
├── README.md            ← документация для людей
├── docker-compose.yml   ← единая точка запуска
├── .env.example         ← шаблон переменных окружения
├── backend/             ← FastAPI + SQLAlchemy + Alembic + Groq
│   ├── app/
│   ├── alembic/
│   ├── tests/
│   ├── pyproject.toml
│   └── Dockerfile
└── frontend/            ← React + TypeScript + Vite + i18n
    ├── src/
    │   ├── components/ui/  ← shadcn/ui примитивы
    │   ├── features/       ← feature-based: tasks, filters, llm, i18n
    │   ├── i18n/           ← ru.json, en.json
    │   ├── lib/
    │   └── types/
    ├── package.json
    └── Dockerfile
```

## Полезные команды для AI-агента

```bash
# Пересобрать только backend (если изменил backend-код)
docker compose build backend && docker compose up -d backend

# Пересобрать только frontend
docker compose build frontend && docker compose up -d frontend

# Применить миграцию вручную
docker compose exec -T backend alembic upgrade head

# Создать новую миграцию после изменения моделей
docker compose exec -T backend alembic revision --autogenerate -m "описание"

# Войти в БД напрямую
docker compose exec -T postgres psql -U focusflow -d focusflow -c "SELECT COUNT(*) FROM tasks;"

# Запустить конкретный тест backend
docker compose exec -T backend pytest tests/test_tasks_api.py::test_filter_by_status -v

# Запустить конкретный тест frontend
docker compose exec -T frontend npx vitest run src/features/tasks/__tests__/TaskBadge.test.tsx

# Проверить формат Python-кода (информационно)
docker compose exec -T backend ruff check app

# Проверить размер базы и количество задач
docker compose exec -T postgres psql -U focusflow -d focusflow -c "\dt+ tasks"
```

## Что делать AI-агенту НЕ надо

- ❌ Запускать `docker compose up` без `-d` — занимает stdin, агент зависнет
- ❌ Использовать `docker compose exec` без `-T` — требует TTY
- ❌ Модифицировать `.env` без необходимости — `.env.example` самодостаточен
- ❌ Ставить зависимости локально (через `pip install` или `npm install` на хосте) — всё внутри контейнеров
- ❌ Запускать `alembic revision --autogenerate` на боевой БД без диффа сначала

---

**Если все критерии успеха зелёные → проект принят.**
