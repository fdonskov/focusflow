import uuid
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import String, TypeDecorator
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.deps import get_task_service
from app.db.base import Base
from app.db.session import get_session
from app.main import app
from app.services.task_service import TaskService

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


class _UUIDString(TypeDecorator):
    """Хранить UUID как строку в SQLite, возвращать как uuid.UUID."""

    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):  # noqa: ANN001
        if value is None:
            return None
        return str(value)

    def process_result_value(self, value, dialect):  # noqa: ANN001
        if value is None:
            return None
        return uuid.UUID(value)


@pytest.fixture(scope="session", autouse=True)
def _patch_uuid_for_sqlite() -> None:
    """Подменяем UUID-тип PostgreSQL на совместимый со SQLite (in-memory тесты)."""
    PGUUID.load_dialect_impl = lambda self, dialect: (  # type: ignore[method-assign]
        dialect.type_descriptor(_UUIDString()) if dialect.name == "sqlite"
        else dialect.type_descriptor(PGUUID(as_uuid=True))
    )


@pytest_asyncio.fixture
async def engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def session(engine) -> AsyncGenerator[AsyncSession, None]:
    maker = async_sessionmaker(engine, expire_on_commit=False)
    async with maker() as s:
        yield s


@pytest_asyncio.fixture
async def client(session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        yield session

    async def override_get_task_service() -> TaskService:
        return TaskService(session)

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[get_task_service] = override_get_task_service

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
