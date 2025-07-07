"use client";

import { useState, useRef, useEffect } from "react";

const VoiceAssistant = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("Disconnected");
  const [isLoading, setIsLoading] = useState(false);

  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);

  const AGENT_ID = "98fb45e1-5ff4-4712-903c-c3aabd9c3892";
  const WS_URL = `ws://localhost:5001/chat/v1/${AGENT_ID}`;

  // Initialize WebSocket connection
  const connectWebSocket = () => {
    try {
      console.log("Starting WebSocket connection to:", WS_URL);
      setIsLoading(true);
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected successfully");
        setIsConnected(true);
        setStatus("Connected - Ready to start call");
        setIsLoading(false);
      };

      wsRef.current.onmessage = (event) => {
        console.log("Received message:", event.data);
        handleIncomingMessage(event.data);
      };

      wsRef.current.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        console.log("WebSocket close event:", event);
        setIsConnected(false);
        setStatus(`Disconnected: ${event.code} - ${event.reason}`);
        setIsLoading(false);
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        console.log("WebSocket readyState:", wsRef.current?.readyState);
        console.log("WebSocket URL:", WS_URL);
        setStatus(
          "Connection Error - Check if Bolna is running on localhost:5001",
        );
        setIsLoading(false);
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      setStatus("Failed to connect - Check if Bolna is running");
      setIsLoading(false);
    }
  };

  // Handle incoming messages from Bolna
  const handleIncomingMessage = (data) => {
    try {
      const message = JSON.parse(data);
      console.log("Parsed message:", message);

      // Handle Bolna's message format
      if (message.type === "audio" && message.data) {
        playAudio(message.data);
      }

      if (message.type === "text" && message.data) {
        console.log("Agent said:", message.data);
        setStatus(`Alfred: "${message.data}"`);
      }

      // Handle mark events and other Bolna message types
      if (message.type === "mark" && message.data) {
        console.log("Mark event received:", message.data);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
      // Handle raw binary data if needed
      if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
        playBinaryAudio(data);
      }
    }
  };

  // Play audio received from Bolna with lower latency
  const playAudio = async (audioData) => {
    try {
      let audioBuffer;

      if (typeof audioData === "string") {
        // Base64 encoded audio
        audioBuffer = Uint8Array.from(atob(audioData), (c) => c.charCodeAt(0));
      } else {
        // Binary audio data
        audioBuffer = new Uint8Array(audioData);
      }

      const blob = new Blob([audioBuffer], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(blob);

      const audio = new Audio(audioUrl);
      // Reduce audio buffering for lower latency
      audio.preload = "auto";
      audio.currentTime = 0;

      // Play immediately without waiting
      audio.play().catch((e) => console.error("Audio play error:", e));

      // Clean up URL after playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  // Play binary audio data
  const playBinaryAudio = async (binaryData) => {
    try {
      const blob = new Blob([binaryData], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(blob);

      const audio = new Audio(audioUrl);
      await audio.play();

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error("Error playing binary audio:", error);
    }
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      setIsLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          latency: 0.01, // Request lowest possible latency
        },
      });

      streamRef.current = stream;

      // Use OPUS codec for lower latency and better compression
      const options = {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 16000,
      };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "audio/webm";
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "audio/wav";
      }

      mediaRecorderRef.current = new MediaRecorder(stream, options);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (
          event.data.size > 0 &&
          wsRef.current?.readyState === WebSocket.OPEN
        ) {
          sendAudioData(event.data);
        }
      };

      mediaRecorderRef.current.onstart = () => {
        setIsRecording(true);
        setStatus("🎤 Recording - Speak now");
        setIsLoading(false);
      };

      mediaRecorderRef.current.start(50); // Send data every 50ms for lower latency
    } catch (error) {
      console.error("Error starting recording:", error);
      setStatus("❌ Microphone access denied or not available");
      setIsLoading(false);
    }
  };

  // Send audio data to Bolna
  const sendAudioData = async (audioBlob) => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Convert to base64
      const base64Audio = btoa(String.fromCharCode(...uint8Array));

      const message = {
        type: "audio",
        data: base64Audio,
      };

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error("Error sending audio:", error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setStatus("✅ Connected - Recording stopped");
  };

  // Start web call
  const startWebCall = () => {
    if (!isConnected) {
      connectWebSocket();
    } else {
      startRecording();
    }
  };

  // End web call
  const endWebCall = () => {
    stopRecording();
    if (wsRef.current) {
      wsRef.current.close();
    }
    setStatus("Call ended");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          🗣️ Bolna Voice Assistant
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Talk to Alfred - Bruce Wayne's AI Butler
        </p>
      </div>

      {/* Status Display */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Status:
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isConnected
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{status}</p>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
          Agent ID: {AGENT_ID}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        {!isConnected && (
          <button
            onClick={startWebCall}
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Connecting...
              </>
            ) : (
              <>🚀 Start Web Call</>
            )}
          </button>
        )}

        {isConnected && !isRecording && (
          <button
            onClick={startRecording}
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Starting...
              </>
            ) : (
              <>🎤 Start Talking</>
            )}
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="w-full sm:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 animate-pulse"
          >
            ⏹️ Stop Talking
          </button>
        )}

        {isConnected && (
          <button
            onClick={endWebCall}
            className="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            📞 End Call
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistant;
