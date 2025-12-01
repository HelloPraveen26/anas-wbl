import asyncio
from agents.agent import DynamicToolHandler

async def main():
    assistant_id = "12df050b-0af4-41fb-ba59-8832d2faec1d"
    backend_url = "http://127.0.0.1:8000/api/v1/assistants/agent-webhook"
    handler = DynamicToolHandler(backend_url, assistant_id)
    ok = await handler.load_tool_config()
    print("loaded:", ok)
    if handler.tool_config:
        print("toolName:", handler.tool_config.get("toolName"))
        print("webhookUrl:", handler.tool_config.get("webhookUrl"))
        print("parameters:", list(handler.tool_config.get("parameters", {}).keys()))
    else:
        print("tool_config is None")
if __name__ == "__main__":
    asyncio.run(main())
