/**
 * Tool: get_weather
 *
 * Returns current weather and a 3-day forecast.
 * Uses Open-Meteo — completely free, no API key required.
 * Geocoding via Open-Meteo's geocoding API.
 */

import type { ToolDefinition, ToolCall, ToolResult } from "./types";

export const weatherTool: ToolDefinition = {
  name: "get_weather",
  description:
    "Returns current weather conditions and a 3-day forecast for any city. " +
    "No API key required. Use when the user asks about weather, temperature, " +
    "or conditions in a specific location.",
  parameters: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "City name, e.g. 'São Paulo', 'New York', 'London'.",
      },
    },
    required: ["location"],
  },
};

const WMO_CODES: Record<number, string> = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Icy fog",
  51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
  61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
  77: "Snow grains",
  80: "Slight showers", 81: "Moderate showers", 82: "Violent showers",
  85: "Slight snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
};

export async function executeWeather(call: ToolCall): Promise<ToolResult> {
  const location = call.arguments.location as string;

  try {
    // 1. Geocode
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    );
    const geoData = await geoRes.json();
    const place = geoData.results?.[0];

    if (!place) {
      return {
        toolCallId: call.id,
        name: call.name,
        content: `Could not find location: "${location}". Try a major city name.`,
        isError: true,
      };
    }

    const { latitude, longitude, name, country } = place;

    // 2. Weather
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code` +
      `&timezone=auto&forecast_days=4`
    );
    const wx = await weatherRes.json();
    const cur = wx.current;
    const daily = wx.daily;

    const result = {
      location: `${name}, ${country}`,
      current: {
        condition: WMO_CODES[cur.weather_code] ?? "Unknown",
        temperature_c: cur.temperature_2m,
        feels_like_c: cur.apparent_temperature,
        humidity_pct: cur.relative_humidity_2m,
        wind_kph: cur.wind_speed_10m,
        precipitation_mm: cur.precipitation,
      },
      forecast: daily.time.slice(1, 4).map((date: string, i: number) => ({
        date,
        condition: WMO_CODES[daily.weather_code[i + 1]] ?? "Unknown",
        high_c: daily.temperature_2m_max[i + 1],
        low_c: daily.temperature_2m_min[i + 1],
        precipitation_mm: daily.precipitation_sum[i + 1],
      })),
    };

    return {
      toolCallId: call.id,
      name: call.name,
      content: JSON.stringify(result),
      isError: false,
    };
  } catch (err: any) {
    return {
      toolCallId: call.id,
      name: call.name,
      content: `Weather fetch failed: ${err?.message ?? "Unknown error"}`,
      isError: true,
    };
  }
}
