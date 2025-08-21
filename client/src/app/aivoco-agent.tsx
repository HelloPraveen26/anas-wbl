"use client";

import { useEffect } from "react";

export default function AIVOCOApplication() {
  useEffect(() => {
    console.log("✅ AIVOCOApplication mounted");
  }, []);

  return (
    <div className="p-4 h-[80vh]">
      <h2 className="text-lg font-bold mb-4">ZENVOCO</h2>
      <iframe
        src="/aivoco.html"
        title="AIVOCO"
        className="w-full h-full border rounded"
      />
    </div>
  );
}  