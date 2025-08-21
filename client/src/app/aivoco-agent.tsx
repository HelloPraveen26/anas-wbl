"use client";

import { useEffect, useRef } from "react";

export default function AIVOCOApplication(props: any) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { systemPrompt, firstMessage } = props;
  const apiKey = process.env.NEXT_PUBLIC_ZENVOCO_API_KEY;

  // useEffect(() => {
  //   console.log("✅ AIVOCOApplication mounted");
  //   if (iframeRef.current) {
  //     iframeRef.current.onload = () => {
  //       iframeRef.current?.contentWindow?.postMessage(
  //         { systemPrompt, firstMessage }
  //       );
  //     };
  //   }
  // }, [props]);


  useEffect(() => {
    const sendMessage = () => {
      iframeRef.current?.contentWindow?.postMessage(
        { systemPrompt, firstMessage, apiKey }
      );
    };

    sendMessage();

    iframeRef.current?.addEventListener("load", sendMessage);

    return () => {
      iframeRef.current?.removeEventListener("load", sendMessage);
    };
  }, [systemPrompt, firstMessage]);

  return (
    <div className="p-4 h-[80vh]">
      <h2 className="text-lg font-bold mb-4">ZENVOCO</h2>
      <iframe
        ref={iframeRef}
        src="/aivoco.html"
        title="AIVOCO"
        className="w-full h-full border rounded"
      />
    </div>
  );
}  