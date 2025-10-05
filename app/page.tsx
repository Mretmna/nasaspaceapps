"use client";

import { useEffect, useState } from "react";
import React from 'react';

// API constants (will be picked up from your Next.js environment)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

// Match the FastAPI calculation response
type CalculationResponse = {
  average_latitude: number | null;
  average_longitude: number | null;
  aqi_data: number | null;
  count: number;
};

// Function to generate the Google Maps Embed URL
const generateMapEmbedUrl = (lat: number, lon: number) => {
    // This creates an iframe-compatible URL for the map
    return `https://maps.google.com/maps?q=${lat},${lon}&t=&z=14&ie=UTF8&iwloc=B&output=embed`;
};


export default function Home() {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CalculationResponse | null>(null);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);

  // Function to fetch calculations (can be called on mount or after submission)
  const fetchCalculations = async () => {
    try {
      // Clear previous error message for this fetch
      setInitialLoadError(null); 
      
      const url = `${API_URL}/calculations`;

      if (!API_KEY) {
          const keyError = "API_KEY is not set (NEXT_PUBLIC_API_KEY). Cannot proceed with fetch.";
          console.error(keyError);
          setInitialLoadError(keyError);
          return; // Stop the fetch if key is missing
      }
      
      console.log(`Attempting to fetch calculations from: ${url}`);

      const res = await fetch(url, {
        method: "POST", // must match FastAPI
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY, // API_KEY is guaranteed to be a string here
        },
        // POST to /calculations doesn't require a body, but sending one can prevent 422 errors if FastAPI expects it
        body: JSON.stringify({}), 
      });

      if (!res.ok) {
        const errorDetail = await res.text();
        throw new Error(`Failed to fetch calculations. Status: ${res.status}. Check API key and CORS. Detail: ${errorDetail.substring(0, 100)}...`);
      }
      
      const json: CalculationResponse = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching calculations:", err);
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setInitialLoadError(`Connection error: ${err.message}. Check if your FastAPI server is running at ${API_URL}`);
      } else if (err instanceof Error) {
        setInitialLoadError(err.message);
      } else {
        setInitialLoadError("An unknown error occurred while fetching calculations.");
      }
    }
  };


  // Fetch calculations on mount
  useEffect(() => {
    // Only attempt fetch if API_URL is defined
    if (API_URL) {
      fetchCalculations();
    } else {
      setInitialLoadError("API_URL is not configured.");
    }
  

    setLoading(true);
    setMessage("Getting your location...");
    setCoords(null);
    setInitialLoadError(null); // Clear initial load error before a new action

    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        setCoords({ latitude, longitude });
        setMessage("📍 Location received! Sending to server...");

        try {
          const response = await fetch(`${API_URL}/coords`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": API_KEY ?? "",
            },
            body: JSON.stringify({ latitude, longitude }),
          });

          if (!response.ok) {
            const errorDetail = await response.text();
            throw new Error(`Server failed to store location. Status: ${response.status}. Detail: ${errorDetail.substring(0, 100)}...`);
          }

          // Await response.json() even if we don't use it to ensure the stream is read
          await response.json(); 
          setMessage("✅ Location sent successfully! Fetching new averages...");

          await fetchCalculations();

        } catch (e) {
            console.error(e);
            setMessage(`❌ Failed to send location to server: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }

        setLoading(false);
      },
      (error) => {
        setMessage(`❌ Geolocation Error: ${error.message}`);
        setLoading(false);
      }
    );}, []);

  const hasAverages = data && data.average_latitude !== null && data.average_longitude !== null;
  const hasCoords = coords !== null;


  return (
    <main className="relative min-h-screen flex items-center justify-center">

      {coords && (
        <div className="absolute inset-0">
          <iframe
            src={generateMapEmbedUrl(coords.latitude, coords.longitude)}
            className="w-full h-full"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Location Map"
          />
        </div>
      )}  
      {data &&
      <div>
  
          <span className="font-mono text-gray-800 text-9xl">
              {data.aqi_data}
          </span>
        
        </div>}

      <div className="relative z-10 p">
        <p className ="text-center text-9xl">deneme</p>
      </div>


    </main>
    
  );
}
