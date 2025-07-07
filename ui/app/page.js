import VoiceAssistant from './components/VoiceAssistant';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Bolna Voice AI
          </h1>
        </div>

        {/* Voice Assistant Component */}
        <div className="mb-12">
          <VoiceAssistant />
        </div>
      </div>
    </div>
  );
}