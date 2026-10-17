"use client";

import { datadogRum } from "@datadog/browser-rum";
import { reactPlugin } from "@datadog/browser-rum-react";

let initialized = false;

export function initDatadogRUM() {
  if (initialized || typeof window === "undefined") return;

  datadogRum.init({
    applicationId: 'b4371de8-c9b1-4b6a-b141-e285784b6433',
    clientToken: 'pubcff29081672b490f67c051329469e0ed',
    site: "ap1.datadoghq.com",
    service: "dhwani-astro",
    env: process.env.CORS_ORIGINS || "development",
    sessionSampleRate: 100,
    sessionReplaySampleRate: 0, 
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    plugins: [reactPlugin({ router: false })],
  });

  initialized = true;
}