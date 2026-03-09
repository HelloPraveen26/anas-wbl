"""Shared modules for voice agents"""
from .config import (
    BACKEND_API_URL,
    DEFAULT_INBOUND_PERSONALITY,
    DEFAULT_OUTBOUND_PERSONALITY,
    INACTIVITY_TIMEOUT,
    MAX_CALL_DURATION,
)
from .handlers import DynamicToolHandler, ToolFactory, load_all_tools
from .providers import ModelProvider

__all__ = [
    "BACKEND_API_URL",
    "DEFAULT_INBOUND_PERSONALITY",
    "DEFAULT_OUTBOUND_PERSONALITY",
    "INACTIVITY_TIMEOUT",
    "MAX_CALL_DURATION",
    "DynamicToolHandler",
    "ToolFactory",
    "load_all_tools",
    "ModelProvider",
]
