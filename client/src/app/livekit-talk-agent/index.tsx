"use client";

// import { headers } from 'next/headers';
import { LiveKitApp } from '@/components/livekit/liveKitApp';
// import { getAppConfig } from '@/lib/utils';

export default function LiveKitApplication() {
//   const hdrs = headers();
//   const appConfig = await getAppConfig(hdrs);

const appConfig = {
    "companyName": "LiveKit",
    "pageTitle": "LiveKit Voice Agent",
    "pageDescription": "A voice agent built with LiveKit",
    "supportsChatInput": true,
    "supportsVideoInput": false,
    "supportsScreenShare": false,
    "isPreConnectBufferEnabled": true,
    "logo": "/lk-logo.svg",
    "accent": "#002cf2",
    "logoDark": "/lk-logo-dark.svg",
    "accentDark": "#1fd5f9",
    "startButtonText": "Start call"
};

  return <LiveKitApp appConfig={appConfig} />;
}