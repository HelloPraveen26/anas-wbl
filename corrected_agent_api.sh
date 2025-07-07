#!/bin/bash

curl --request POST \
  --url "http://localhost:5001/agent" \
  --header 'Content-Type: application/json' \
  --data '{
  "agent_config": {
    "agent_name": "mysample123",
    "agent_welcome_message": "Hi thanks for calling. This is a Demo call for Bolna'\''s voice AI.",
    "webhook_url": null,
    "agent_type": "other",
    "tasks": [
      {
        "task_type": "conversation",
        "tools_config": {
          "input": {
            "provider": "default",
            "format": "wav"
          },
          "output": {
            "provider": "default",
            "format": "wav"
          },
          "llm_agent": {
            "agent_type": "simple_llm_agent",
            "agent_flow_type": "streaming",
            "llm_config": {
              "provider": "openai",
              "family": "openai",
              "model": "gpt-4o-mini",
              "max_tokens": 200,
              "temperature": 0.7,
              "top_p": 0.9,
              "min_p": 0.1,
              "top_k": 0,
              "presence_penalty": 0.0,
              "frequency_penalty": 0.0,
              "request_json": false,
              "agent_flow_type": "streaming",
              "summarization_details": null,
              "extraction_details": null,
              "base_url": null,
              "stop": null
            },
            "routes": null
          },
          "synthesizer": {
            "provider": "openai",
            "provider_config": {
              "voice": "alloy",
              "model": "tts-1"
            },
            "stream": true,
            "buffer_size": 100,
            "audio_format": "wav",
            "caching": true
          },
          "transcriber": {
            "provider": "deepgram",
            "model": "nova-2",
            "language": "en",
            "stream": true,
            "sampling_rate": 16000,
            "encoding": "linear16",
            "endpointing": 300,
            "task": "transcribe",
            "keywords": null,
            "process_interim_results": false
          },
          "api_tools": null
        },
        "toolchain": {
          "execution": "parallel",
          "pipelines": [
            ["transcriber", "llm", "synthesizer"]
          ]
        },
        "task_config": {
          "voicemail": false,
          "use_fillers": true,
          "ambient_noise": false,
          "ambient_noise_track": "office-ambience",
          "inbound_limit": 3,
          "call_terminate": 300,
          "optimize_latency": false,
          "incremental_delay": 100,
          "check_if_user_online": true,
          "check_user_online_message": "Hey, are you still there?",
          "trigger_user_online_message_after": 15,
          "hangup_after_LLMCall": false,
          "hangup_after_silence": 30,
          "call_cancellation_prompt": null,
          "call_hangup_message": null,
          "whitelist_phone_numbers": null,
          "disallow_unknown_numbers": false,
          "backchanneling": false,
          "backchanneling_message_gap": 5,
          "backchanneling_start_delay": 5,
          "generate_precise_transcript": false,
          "interruption_backoff_period": 100,
          "number_of_words_for_interruption": 3
        }
      }
    ]
  },
  "agent_prompts": {
    "task_1": {
      "system_prompt": "You are Mahesh, a warm, perceptive, and grounded recruitment specialist. You are conducting a friendly interview to assess candidates. Keep your responses conversational, professional, and engaging. Ask relevant questions about their experience and qualifications. Always be polite and encouraging."
    }
  }
}'