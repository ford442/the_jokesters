"""
FastAPI Proxy for llama-server

This module provides an OpenAI-compatible streaming proxy endpoint
that forwards requests to a local llama-server instance.

Usage:
    from fastapi import FastAPI
    from llama_proxy import router

    app = FastAPI()
    app.include_router(router, prefix="/v1")

Environment variables:
    LLAMA_SERVER_URL - URL of the llama-server (default: http://localhost:8080)
"""

import os
import httpx
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse

router = APIRouter()

LLAMA_SERVER_URL = os.getenv("LLAMA_SERVER_URL", "http://localhost:8080")


@router.post("/chat/completions")
async def chat_completions(request: Request):
    """
    Proxy chat completion requests to llama-server with streaming support.

    Supports both text and multimodal (image_url) messages for vision models
    like Kimi-VL when llama-server is started with --mmproj.
    """
    try:
        body = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON body: {e}")

    async with httpx.AsyncClient(timeout=None) as client:
        try:
            async with client.stream(
                "POST",
                f"{LLAMA_SERVER_URL}/v1/chat/completions",
                json=body,
                headers={"Content-Type": "application/json"},
            ) as resp:
                if resp.status_code >= 400:
                    err_body = await resp.aread()
                    raise HTTPException(
                        status_code=resp.status_code,
                        detail=err_body.decode("utf-8", errors="replace"),
                    )

                return StreamingResponse(
                    resp.aiter_bytes(),
                    media_type="text/event-stream",
                    headers={
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                    },
                )
        except httpx.ConnectError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Cannot connect to llama-server at {LLAMA_SERVER_URL}: {e}",
            )
