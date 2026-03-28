"""Workaround for Gemini 3.1 Flash Live — send_client_content compatibility.

Gemini 3.1 rejects ALL send_client_content calls after the initial connection
(1007 "invalid frame payload data"). The LiveKit plugin sends LiveClientContent
messages from multiple code paths:

  - generate_reply()       → triggers model speech (turn_complete=True)
  - update_instructions()  → mid-session instruction update (turn_complete=False)
  - update_chat_ctx()      → context sync (turn_complete=False)
  - session connect        → initial history push (turn_complete=False)

This module monkey-patches TWO methods at the class level:

  1. _send_client_event() — intercepts ALL LiveClientContent messages for 3.1:
     - turn_complete=True → converted to LiveClientRealtimeInput(text=...)
     - turn_complete=False → dropped silently (3.1 rejects context pushes)

  2. generate_reply() — reimplemented for 3.1 to bypass LiveClientContent entirely

Non-3.1 models (e.g., 2.5 Flash) are completely unaffected.

Ref: https://github.com/livekit/agents/issues/5234
TODO: REMOVE when livekit-plugins-google ships native Gemini 3.1 support.
"""

import asyncio
import logging
from typing import Any

logger = logging.getLogger("zenvoice.gemini-fix")

_patched = False


def _is_3_1_model(session: Any) -> bool:
    """Check if the session's model name contains '3.1'."""
    return "3.1" in getattr(getattr(session, "_opts", None), "model", "")


def apply_gemini_3_1_patch() -> None:
    """Apply class-level monkey patches for Gemini 3.1 Flash compatibility.

    Safe to call multiple times — only patches once.
    Must be called before any AgentSession is started.
    """
    global _patched
    if _patched:
        return

    try:
        from google.genai import types as genai_types
        from livekit.agents.llm import RealtimeError
        from livekit.agents.types import NOT_GIVEN
        from livekit.agents.utils import is_given
        from livekit.plugins.google.realtime.realtime_api import (
            RealtimeSession as GeminiRS,
        )

        original_send_client_event = GeminiRS._send_client_event
        original_generate_reply = GeminiRS.generate_reply

        # --- Patch 1: intercept ALL LiveClientContent for 3.1 models ---
        def _patched_send_client_event(self: Any, event: Any) -> None:
            if _is_3_1_model(self) and isinstance(event, genai_types.LiveClientContent):
                if event.turn_complete:
                    # turn_complete=True → extract text and send as realtime input
                    text = "."
                    if event.turns:
                        for turn in event.turns:
                            if turn.parts:
                                for part in turn.parts:
                                    if getattr(part, "text", None):
                                        text = part.text
                    logger.debug(
                        "3.1 fix: converting LiveClientContent (turn_complete) → "
                        "LiveClientRealtimeInput(text=%r)",
                        text[:80],
                    )
                    original_send_client_event(
                        self, genai_types.LiveClientRealtimeInput(text=text)
                    )
                else:
                    # turn_complete=False → context push, drop for 3.1
                    logger.debug(
                        "3.1 fix: dropping LiveClientContent (turn_complete=False)"
                    )
                return
            original_send_client_event(self, event)

        # --- Patch 2: generate_reply for 3.1 uses realtime input directly ---
        def _patched_generate_reply(
            self: Any, *, instructions: Any = NOT_GIVEN
        ) -> asyncio.Future:
            # Non-3.1 models: use original (send_client_content works fine)
            if not _is_3_1_model(self):
                return original_generate_reply(self, instructions=instructions)

            # --- 3.1 path: replicate generate_reply but via send_realtime_input ---
            if self._pending_generation_fut and not self._pending_generation_fut.done():
                self._pending_generation_fut.cancel(
                    "Superseded by new generate_reply call"
                )

            fut: asyncio.Future = asyncio.Future()
            self._pending_generation_fut = fut

            if self._in_user_activity:
                self._send_client_event(
                    genai_types.LiveClientRealtimeInput(
                        activity_end=genai_types.ActivityEnd(),
                    )
                )
                self._in_user_activity = False

            # 3.1 fix: send text via send_realtime_input instead of send_client_content
            text = instructions if is_given(instructions) else "."
            self._send_client_event(
                genai_types.LiveClientRealtimeInput(text=text)
            )

            def _on_timeout() -> None:
                if not fut.done():
                    fut.set_exception(
                        RealtimeError(
                            "generate_reply timed out waiting for generation_created event."
                        )
                    )
                if self._pending_generation_fut is fut:
                    self._pending_generation_fut = None

            timeout_handle = asyncio.get_event_loop().call_later(5.0, _on_timeout)
            fut.add_done_callback(lambda _: timeout_handle.cancel())
            return fut

        GeminiRS._send_client_event = _patched_send_client_event  # type: ignore[assignment]
        GeminiRS.generate_reply = _patched_generate_reply  # type: ignore[assignment]
        _patched = True
        logger.info(
            "Gemini 3.1 monkey-patch applied (generate_reply + _send_client_event)"
        )

    except ImportError:
        logger.debug("Google plugin not available — skipping Gemini 3.1 patch")