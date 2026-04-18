from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    status_code: int = 500
    code: str = "internal_error"

    def __init__(self, message: str, *, code: str | None = None, field: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        if code is not None:
            self.code = code
        self.field = field


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class ValidationError(AppError):
    status_code = 422
    code = "validation_error"


class LLMError(AppError):
    status_code = 502
    code = "llm_error"


class LLMNotConfiguredError(AppError):
    status_code = 503
    code = "llm_not_configured"


async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    payload: dict[str, str | None] = {
        "detail": exc.message,
        "code": exc.code,
    }
    if exc.field:
        payload["field"] = exc.field
    return JSONResponse(status_code=exc.status_code, content=payload)
