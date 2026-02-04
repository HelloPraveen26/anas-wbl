
'use client';

import React, { useState, useEffect } from 'react';
import {
    AudioWaveform,
    Play,
    Pause,
    Volume2,
    Plus,
    Search,
    Upload,
    Clock
} from 'lucide-react';


interface Voice {
    id: string;
    name: string;
    description: string;
    platform: 'Sarvam' | 'Gemini';
    gender: 'male' | 'female';
    tone: string;
    bestFor?: string;
    isPlaying: boolean;
    audioFile?: string;
}

const voiceData: Voice[] = [
    // Sarvam Voices (Bulbul-v2 Model)

    {
        id: 'sarvam-1',
        name: 'Anushka',
        description: 'Clear and professional (Default Voice)',
        platform: 'Sarvam',
        gender: 'female',
        tone: 'Professional',
        bestFor: 'Audiobooks, Professional Narration, Corporate Training',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'sarvam-2',
        name: 'Manisha',
        description: 'Warm and friendly',
        platform: 'Sarvam',
        gender: 'female',
        tone: 'Friendly',
        bestFor: 'Conversational content',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'sarvam-3',
        name: 'Vidya',
        description: 'Articulate and precise',
        platform: 'Sarvam',
        gender: 'female',
        tone: 'Precise',
        bestFor: 'Clear narration',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'sarvam-4',
        name: 'Arya',
        description: 'Young and energetic',
        platform: 'Sarvam',
        gender: 'female',
        tone: 'Energetic',
        bestFor: 'Lively content',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'sarvam-5',
        name: 'Abhilash',
        description: 'Deep and authoritative',
        platform: 'Sarvam',
        gender: 'male',
        tone: 'Authoritative',
        bestFor: 'Security Systems, Announcements, Documentaries',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'sarvam-6',
        name: 'Karun',
        description: 'Natural and conversational',
        platform: 'Sarvam',
        gender: 'male',
        tone: 'Conversational',
        bestFor: 'General conversational content',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'sarvam-7',
        name: 'Hitesh',
        description: 'Professional and engaging',
        platform: 'Sarvam',
        gender: 'male',
        tone: 'Professional',
        bestFor: 'Formal and professional content',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    // Gemini Female Voices
    {
        id: 'gemini-f-1',
        name: 'Zephyr',
        description: 'Bright female voice',
        platform: 'Gemini',
        gender: 'female',
        tone: 'Bright',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-f-2',
        name: 'Kore',
        description: 'Firm female voice',
        platform: 'Gemini',
        gender: 'female',
        tone: 'Firm',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-f-3',
        name: 'Leda',
        description: 'Youthful female voice',
        platform: 'Gemini',
        gender: 'female',
        tone: 'Youthful',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-f-4',
        name: 'Aoede',
        description: 'Breezy female voice',
        platform: 'Gemini',
        gender: 'female',
        tone: 'Breezy',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-f-5',
        name: 'Callirrhoe',
        description: 'Easy-going female voice',
        platform: 'Gemini',
        gender: 'female',
        tone: 'Easy-going',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-f-6',
        name: 'Autonoe',
        description: 'Bright female voice',
        platform: 'Gemini',
        gender: 'female',
        tone: 'Bright',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-f-7',
        name: 'Despina',
        description: 'Smooth female voice',
        platform: 'Gemini',
        gender: 'female',
        tone: 'Smooth',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-f-8',
        name: 'Erinome',
        description: 'Clear female voice',
        platform: 'Gemini',
        gender: 'female',
        tone: 'Clear',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-f-9',
        name: 'Laomedeia',
        description: 'Upbeat female voice',
        platform: 'Gemini',
        gender: 'female',
        tone: 'Upbeat',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-f-10',
        name: 'Achernar',
        description: 'Soft female voice',
        platform: 'Gemini',
        gender: 'female',
        tone: 'Soft',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-f-11',
        name: 'Gacrux',
        description: 'Mature female voice',
        platform: 'Gemini',
        gender: 'female',
        tone: 'Mature',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-f-12',
        name: 'Pulcherrima',
        description: 'Forward female voice',
        platform: 'Gemini',
        gender: 'female',
        tone: 'Forward',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-f-13',
        name: 'Vindemiatrix',
        description: 'Gentle female voice',
        platform: 'Gemini',
        gender: 'female',
        tone: 'Gentle',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-f-14',
        name: 'Sulafat',
        description: 'Warm female voice',
        platform: 'Gemini',
        gender: 'female',
        tone: 'Warm',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    // Gemini Male Voices
    {
        id: 'gemini-m-1',
        name: 'Puck',
        description: 'Upbeat male voice',
        platform: 'Gemini',
        gender: 'male',
        tone: 'Upbeat',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-m-2',
        name: 'Charon',
        description: 'Informative male voice',
        platform: 'Gemini',
        gender: 'male',
        tone: 'Informative',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-m-3',
        name: 'Fenrir',
        description: 'Excitable male voice',
        platform: 'Gemini',
        gender: 'male',
        tone: 'Excitable',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-m-4',
        name: 'Orus',
        description: 'Firm male voice',
        platform: 'Gemini',
        gender: 'male',
        tone: 'Firm',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-m-5',
        name: 'Enceladus',
        description: 'Breathy male voice',
        platform: 'Gemini',
        gender: 'male',
        tone: 'Breathy',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-m-6',
        name: 'Iapetus',
        description: 'Clear male voice',
        platform: 'Gemini',
        gender: 'male',
        tone: 'Clear',

        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-m-7',
        name: 'Umbriel',
        description: 'Easy-going male voice',
        platform: 'Gemini',
        gender: 'male',
        tone: 'Easy-going',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-m-8',
        name: 'Algieba',
        description: 'Smooth male voice',
        platform: 'Gemini',
        gender: 'male',
        tone: 'Smooth',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-m-9',
        name: 'Algenib',
        description: 'Gravelly male voice',
        platform: 'Gemini',
        gender: 'male',
        tone: 'Gravelly',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-m-10',
        name: 'Rasalgethi',
        description: 'Informative male voice',
        platform: 'Gemini',
        gender: 'male',
        tone: 'Informative',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-m-11',
        name: 'Alnilam',
        description: 'Firm male voice',
        platform: 'Gemini',
        gender: 'male',
        tone: 'Firm',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-m-12',
        name: 'Schedar',
        description: 'Even male voice',
        platform: 'Gemini',
        gender: 'male',
        tone: 'Even',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-m-13',
        name: 'Achird',
        description: 'Friendly male voice',
        platform: 'Gemini',
        gender: 'male',
        tone: 'Friendly',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-m-14',
        name: 'Zubenelgenubi',
        description: 'Casual male voice',
        platform: 'Gemini',
        gender: 'male',
        tone: 'Casual',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-m-15',
        name: 'Sadachbia',
        description: 'Lively male voice',
        platform: 'Gemini',
        gender: 'male',
        tone: 'Lively',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    },
    {
        id: 'gemini-m-16',
        name: 'Sadaltager',
        description: 'Knowledgeable male voice',
        platform: 'Gemini',
        gender: 'male',
        tone: 'Knowledgeable',
        isPlaying: false,
        audioFile: '/audios/TAMIL.mp3'
    }
];


export default function VoicesPage() {
    const [voices] = useState<Voice[]>(voiceData);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState('All');
    const [selectedGender, setSelectedGender] = useState('All');

    const [isPlaying, setIsPlaying] = useState<string | null>(null);
    const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({});

    useEffect(() => {
        return () => {
            Object.values(audioElements).forEach(audio => {
                audio.pause();
                audio.src = '';
            });
        };
    }, [audioElements]);

    const platforms = ['All', 'Sarvam', 'Gemini'];
    const genders = ['All', 'Male', 'Female'];

    const filteredVoices = voices.filter(voice => {
        const matchesSearch = voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            voice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            voice.tone.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesPlatform = selectedPlatform === 'All' || voice.platform === selectedPlatform;
        const matchesGender = selectedGender === 'All' || voice.gender.toLowerCase() === selectedGender.toLowerCase();

        return matchesSearch && matchesPlatform && matchesGender;
    });


    const handlePlayPause = (voiceId: string) => {
        const voice = voices.find(v => v.id === voiceId);
        if (!voice || !voice.audioFile) {
            console.log('No audio file for this voice');
            return;
        }

        if (isPlaying === voiceId) {
            // Stop current audio
            setIsPlaying(null);
            const audio = audioElements[voiceId];
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        } else {
            // Stop any currently playing audio
            Object.values(audioElements).forEach(audio => {
                audio.pause();
                audio.currentTime = 0;
            });

            // Play new audio
            setIsPlaying(voiceId);

            let audio = audioElements[voiceId];
            if (!audio) {
                audio = new Audio(voice.audioFile);
                audio.addEventListener('ended', () => setIsPlaying(null));
                audio.addEventListener('error', (e) => {
                    console.error('Audio error:', e);
                    setIsPlaying(null);
                });
                setAudioElements(prev => ({ ...prev, [voiceId]: audio! }));
            }

            audio.play().catch(error => {
                console.error('Error playing audio:', error);
                setIsPlaying(null);
            });
        }
    };

    const getPlatformColor = (platform: string) => {
        return platform === 'Sarvam'
            ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
            : 'bg-blue-100 text-blue-800 border-blue-200';
    };

    const getGenderColor = (gender: string) => {
        return gender === 'male'
            ? 'bg-cyan-100 text-cyan-800 border-cyan-200'
            : 'bg-rose-100 text-rose-800 border-rose-200';
    };

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200 flex-shrink-0">
                <div className="px-6 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-emerald-800">AI Voice Library</h1>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search voices..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
                            />
                        </div>

                        {/* Platform Dropdown */}
                        <div className="w-full sm:w-[180px]">
                            <select
                                id="platform-select"
                                value={selectedPlatform}
                                onChange={(e) => setSelectedPlatform(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                            >
                                <option value="" disabled>Platform</option>
                                {platforms.map(platform => (
                                    <option key={platform} value={platform}>
                                        {platform === 'All' ? 'All Model' : platform}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Gender Dropdown */}
                        <div className="w-full lg:w-[180px]">
                            <select
                                id="gender-select"
                                value={selectedGender}
                                onChange={(e) => setSelectedGender(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                            >
                                <option value="" disabled>Gender</option>
                                {genders.map(gender => (
                                    <option key={gender} value={gender}>
                                        {gender === 'All' ? 'All Genders' : gender}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    {filteredVoices.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredVoices.map((voice) => (
                                <div
                                    key={voice.id}
                                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group flex flex-col h-full"
                                >
                                    {/* Voice Name */}
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                            {voice.name}
                                        </h3>
                                        <p className="text-sm text-slate-600 leading-relaxed min-h-[40px]">{voice.description}</p>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                                        <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${getPlatformColor(voice.platform)}`}>
                                            {voice.platform}
                                        </span>
                                        <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${getGenderColor(voice.gender)}`}>
                                            {voice.gender.charAt(0).toUpperCase() + voice.gender.slice(1)}
                                        </span>
                                        <span className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                                            {voice.tone}
                                        </span>
                                    </div>

                                    {/* Spacer to push button to bottom */}
                                    <div className="flex-grow"></div>

                                    {/* Play Button */}
                                    <div className="pt-4 border-t border-slate-100">
                                        <button
                                            onClick={() => handlePlayPause(voice.id)}
                                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isPlaying === voice.id
                                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                        >
                                            {isPlaying === voice.id ? (
                                                <>
                                                    <Pause className="w-4 h-4" />
                                                    Stop Preview
                                                    <Volume2 className="w-4 h-4 animate-pulse" />
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4" />
                                                    Play Preview
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AudioWaveform className="w-12 h-12 text-slate-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">No voices found</h3>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Stats */}
            <div className="bg-white/90 backdrop-blur-xl border-t border-slate-200 flex-shrink-0">
                <div className="px-6 py-5">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 md:gap-6 text-slate-600">
                            <span className="font-semibold text-slate-900">
                                {filteredVoices.length} {filteredVoices.length === 1 ? 'Voice' : 'Voices'}
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                {voices.filter(v => v.platform === 'Sarvam').length} Sarvam
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                {voices.filter(v => v.platform === 'Gemini').length} Gemini
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}