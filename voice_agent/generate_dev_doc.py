"""Generate the integration developer documentation PDF using ReportLab."""

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUTPUT = "docs/integration_guide.pdf"


def build_pdf() -> None:
    import os

    os.makedirs("docs", exist_ok=True)

    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        topMargin=25 * mm,
        bottomMargin=20 * mm,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Title"],
        fontSize=22,
        spaceAfter=6,
        textColor=colors.HexColor("#1a1a2e"),
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontSize=11,
        textColor=colors.grey,
        alignment=TA_CENTER,
        spaceAfter=20,
    )
    h1 = ParagraphStyle(
        "H1",
        parent=styles["Heading1"],
        fontSize=16,
        spaceBefore=18,
        spaceAfter=8,
        textColor=colors.HexColor("#16213e"),
    )
    h2 = ParagraphStyle(
        "H2",
        parent=styles["Heading2"],
        fontSize=13,
        spaceBefore=14,
        spaceAfter=6,
        textColor=colors.HexColor("#0f3460"),
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        spaceAfter=6,
    )
    code_style = ParagraphStyle(
        "Code",
        parent=styles["Code"],
        fontSize=8.5,
        leading=11,
        backColor=colors.HexColor("#f4f4f4"),
        borderColor=colors.HexColor("#dddddd"),
        borderWidth=0.5,
        borderPadding=6,
        spaceAfter=10,
        fontName="Courier",
    )
    note_style = ParagraphStyle(
        "Note",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#e94560"),
        spaceBefore=4,
        spaceAfter=8,
    )

    story = []

    # ── Title ──
    story.append(Paragraph("ZenVoice Integration Guide", title_style))
    story.append(Paragraph("AWS Nova Sonic 2 &amp; ElevenLabs TTS", subtitle_style))
    story.append(Paragraph("Version 1.0 | February 2026", subtitle_style))
    story.append(Spacer(1, 12))

    # ── Overview ──
    story.append(Paragraph("1. Overview", h1))
    story.append(Paragraph(
        "This document describes how two new voice providers have been integrated "
        "into the ZenVoice voice agent platform:",
        body,
    ))
    story.append(Paragraph(
        "<b>AWS Nova Sonic 2</b> &mdash; A realtime speech-to-speech model from Amazon Bedrock. "
        "It replaces the entire STT + LLM + TTS pipeline with a single bidirectional audio model "
        "(same pattern as Gemini Realtime).",
        body,
    ))
    story.append(Paragraph(
        "<b>ElevenLabs TTS</b> &mdash; A high-quality text-to-speech provider used in the pipelined "
        "approach (STT + LLM + ElevenLabs TTS).",
        body,
    ))

    # ── Architecture ──
    story.append(Paragraph("2. Architecture", h1))
    story.append(Paragraph(
        "The agent supports two operational modes depending on the provider selected:",
        body,
    ))

    arch_data = [
        ["Mode", "Provider Name", "Pipeline", "Components Used"],
        ["Pipelined", "ElevenLabs", "STT -> LLM -> TTS", "Deepgram STT + OpenAI LLM + ElevenLabs TTS"],
        ["Realtime", "Nova Sonic", "Speech-to-Speech", "AWS Nova Sonic 2 (single model)"],
        ["Realtime", "Gemini Realtime", "Speech-to-Speech", "Google Gemini (single model)"],
    ]
    arch_table = Table(arch_data, colWidths=[65, 90, 110, 200])
    arch_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#16213e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f8f8")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 8))

    # ── Prerequisites ──
    story.append(Paragraph("3. Prerequisites", h1))

    story.append(Paragraph("3.1 Dependencies", h2))
    story.append(Paragraph("The following packages were added to <font face='Courier'>pyproject.toml</font>:", body))
    story.append(Paragraph(
        'livekit-agents[aws,azure,deepgram,elevenlabs,google,groq,lmnt,openai,sarvam,silero]~=1.3.10<br/>'
        'livekit-plugins-aws[realtime]',
        code_style,
    ))
    story.append(Paragraph("Install with: <font face='Courier'>uv sync</font>", body))

    story.append(Paragraph("3.2 Environment Variables", h2))

    env_data = [
        ["Variable", "Provider", "Description"],
        ["ELEVEN_API_KEY", "ElevenLabs", "API key from elevenlabs.io/app/settings/api-keys"],
        ["AWS_ACCESS_KEY_ID", "Nova Sonic", "IAM access key with Bedrock permissions"],
        ["AWS_SECRET_ACCESS_KEY", "Nova Sonic", "IAM secret access key"],
        ["AWS_DEFAULT_REGION", "Nova Sonic", "AWS region (default: ap-northeast-1)"],
    ]
    env_table = Table(env_data, colWidths=[140, 80, 250])
    env_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#16213e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (0, -1), "Courier"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f8f8")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(env_table)
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "IMPORTANT: Nova Sonic 2 is NOT available in ap-south-1. "
        "Supported regions: us-east-1, us-west-2, eu-north-1, ap-northeast-1 (Tokyo).",
        note_style,
    ))

    # ── Nova Sonic 2 ──
    story.append(Paragraph("4. AWS Nova Sonic 2 Integration", h1))

    story.append(Paragraph("4.1 What is Nova Sonic 2?", h2))
    story.append(Paragraph(
        "Amazon Nova Sonic 2 is a speech-to-speech model from AWS Bedrock. It handles "
        "speech understanding and generation in a single model with bidirectional audio streaming, "
        "16 voices across 8 languages, and a 1M token context window.",
        body,
    ))

    story.append(Paragraph("4.2 Configuration", h2))
    story.append(Paragraph("The model is created via the LiveKit AWS plugin:", body))
    story.append(Paragraph(
        'from livekit.plugins import aws<br/><br/>'
        'model = aws.realtime.RealtimeModel.with_nova_sonic_2(<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;voice="tiffany",<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;turn_detection="MEDIUM",<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;region="ap-northeast-1",<br/>'
        ')',
        code_style,
    ))

    story.append(Paragraph("4.3 Parameters", h2))
    nova_params = [
        ["Parameter", "Type", "Default", "Description"],
        ["voice", "string", "tiffany", "Voice name (16 available: tiffany, joanna, matthew, aria, etc.)"],
        ["turn_detection", "string", "MEDIUM", "Turn-taking sensitivity: HIGH, MEDIUM, or LOW"],
        ["region", "string", "us-east-1", "AWS region for Bedrock endpoint"],
        ["temperature", "float", "0.7", "Sampling temperature (0-1)"],
        ["top_p", "float", "0.9", "Nucleus sampling probability"],
        ["max_tokens", "int", "1024", "Upper bound for tokens emitted"],
        ["generate_reply_timeout", "float", "10.0", "Timeout for generate_reply() in seconds"],
    ]
    nova_table = Table(nova_params, colWidths=[110, 50, 65, 245])
    nova_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#16213e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (0, -1), "Courier"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f8f8")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(nova_table)
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "Note: Nova Sonic has an 8-minute session limit. The LiveKit plugin handles "
        "session recycling automatically.",
        note_style,
    ))

    story.append(Paragraph("4.4 API Request Example", h2))
    story.append(Paragraph(
        'POST /make_call<br/>'
        '{<br/>'
        '&nbsp;&nbsp;"phone_number": "+919876543210",<br/>'
        '&nbsp;&nbsp;"outbound_trunk_id": "ST_xxx",<br/>'
        '&nbsp;&nbsp;"realtime_provider_name": "Nova Sonic",<br/>'
        '&nbsp;&nbsp;"realtime_model_config": {<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;"voice": "tiffany",<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;"turn_detection": "MEDIUM"<br/>'
        '&nbsp;&nbsp;},<br/>'
        '&nbsp;&nbsp;"instructions": "You are a helpful assistant.",<br/>'
        '&nbsp;&nbsp;"first_message": "Hello! How can I help?"<br/>'
        '}',
        code_style,
    ))

    # ── ElevenLabs ──
    story.append(Paragraph("5. ElevenLabs TTS Integration", h1))

    story.append(Paragraph("5.1 What is ElevenLabs?", h2))
    story.append(Paragraph(
        "ElevenLabs provides AI-powered text-to-speech with natural-sounding voices. "
        "It is used as a TTS provider in the pipelined approach (STT + LLM + TTS). "
        "The LiveKit plugin authenticates via the ELEVEN_API_KEY environment variable.",
        body,
    ))

    story.append(Paragraph("5.2 Configuration", h2))
    story.append(Paragraph(
        'from livekit.plugins import elevenlabs<br/><br/>'
        'session = AgentSession(<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;tts=elevenlabs.TTS(<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;voice_id="ODq5zmih8GrVes37Dizd",<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;model="eleven_multilingual_v2"<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;),<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;stt=deepgram.STT(),<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;llm=openai.LLM(),<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;vad=silero.VAD.load(),<br/>'
        ')',
        code_style,
    ))

    story.append(Paragraph("5.3 Parameters", h2))
    el_params = [
        ["Parameter", "Type", "Default", "Description"],
        ["voice_id", "string", "EXAVITQu4vr4xnSDxMaL", "Voice ID from ElevenLabs voice library"],
        ["model", "string", "eleven_flash_v2_5", "TTS model (eleven_flash_v2_5, eleven_multilingual_v2, etc.)"],
        ["language", "string", "en", "ISO-639-1 language code"],
        ["stability", "float", "0.5", "Voice stability (0-1, via voice_settings)"],
        ["similarity_boost", "float", "0.75", "Voice similarity (0-1, via voice_settings)"],
        ["speed", "float", "1.0", "Speech speed multiplier (via voice_settings)"],
        ["enable_ssml_parsing", "bool", "false", "Enable SSML markup for pronunciation control"],
    ]
    el_table = Table(el_params, colWidths=[110, 50, 115, 195])
    el_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#16213e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (0, -1), "Courier"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f8f8")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(el_table)

    story.append(Paragraph("5.4 API Request Example", h2))
    story.append(Paragraph(
        'POST /make_call<br/>'
        '{<br/>'
        '&nbsp;&nbsp;"phone_number": "+919876543210",<br/>'
        '&nbsp;&nbsp;"outbound_trunk_id": "ST_xxx",<br/>'
        '&nbsp;&nbsp;"tts_provider_name": "ElevenLabs",<br/>'
        '&nbsp;&nbsp;"tts_config": {<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;"voice_id": "ODq5zmih8GrVes37Dizd",<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;"model": "eleven_multilingual_v2"<br/>'
        '&nbsp;&nbsp;},<br/>'
        '&nbsp;&nbsp;"instructions": "You are a helpful assistant.",<br/>'
        '&nbsp;&nbsp;"first_message": "Hello! How can I help?"<br/>'
        '}',
        code_style,
    ))

    # ── Local Testing ──
    story.append(Paragraph("6. Local Testing", h1))
    story.append(Paragraph(
        "A <font face='Courier'>generate_token.py</font> script is provided for quick local testing. "
        "It generates a LiveKit token with an embedded agent dispatch:",
        body,
    ))
    story.append(Paragraph(
        '# Start the agent worker first<br/>'
        'uv run agents/agent.py dev<br/><br/>'
        '# In another terminal, generate token + meet link<br/>'
        'uv run python generate_token.py --provider nova-sonic<br/>'
        'uv run python generate_token.py --provider elevenlabs<br/>'
        'uv run python generate_token.py --provider gemini<br/>'
        'uv run python generate_token.py --provider default',
        code_style,
    ))
    story.append(Paragraph(
        "The script outputs a meet.livekit.io URL. Open it in a browser to join the room "
        "and talk to the agent.",
        body,
    ))

    # ── Files Changed ──
    story.append(Paragraph("7. Files Changed", h1))
    files_data = [
        ["File", "Change"],
        ["pyproject.toml", "Added aws, elevenlabs extras + livekit-plugins-aws[realtime]"],
        ["agents/.env", "Added ELEVEN_API_KEY, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION"],
        ["agents/agent.py", "Added aws/elevenlabs imports, factory functions, router entries"],
        ["generate_token.py", "New file: token generation with provider presets and RoomAgentDispatch"],
        ["docs/integration_guide.pdf", "This document"],
    ]
    files_table = Table(files_data, colWidths=[160, 310])
    files_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#16213e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (0, -1), "Courier"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f8f8")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(files_table)

    # ── Provider Summary ──
    story.append(Paragraph("8. Supported Providers Summary", h1))
    summary_data = [
        ["Component", "Provider", "Provider Name Value", "Default"],
        ["Realtime", "Gemini", 'realtime_provider_name="Gemini Realtime"', ""],
        ["Realtime", "Nova Sonic 2", 'realtime_provider_name="Nova Sonic"', ""],
        ["LLM", "OpenAI", 'llm_provider_name="OpenAI"', "Yes"],
        ["LLM", "Groq", 'llm_provider_name="Groq"', ""],
        ["STT", "Deepgram", 'stt_provider_name="Deepgram"', "Yes"],
        ["STT", "Sarvam", 'stt_provider_name="Sarvam"', ""],
        ["STT", "Groq", 'stt_provider_name="Groq"', ""],
        ["STT", "Azure", 'stt_provider_name="Azure"', ""],
        ["TTS", "Deepgram", 'tts_provider_name="Deepgram"', "Yes"],
        ["TTS", "ElevenLabs", 'tts_provider_name="ElevenLabs"', ""],
        ["TTS", "Sarvam", 'tts_provider_name="Sarvam"', ""],
        ["TTS", "Gemini", 'tts_provider_name="Gemini"', ""],
        ["TTS", "Groq", 'tts_provider_name="Groq"', ""],
        ["TTS", "Azure", 'tts_provider_name="Azure"', ""],
        ["TTS", "LMNT", 'tts_provider_name="lmnt"', ""],
    ]
    summary_table = Table(summary_data, colWidths=[65, 80, 260, 50])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#16213e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (2, -1), "Courier"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f8f8")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(summary_table)

    doc.build(story)
    print(f"PDF generated: {OUTPUT}")


if __name__ == "__main__":
    build_pdf()
