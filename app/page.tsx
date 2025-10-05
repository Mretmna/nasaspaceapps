"use client";

import { useEffect, useState } from "react";
import React from 'react'; // Explicitly import React for JSX

// API constants (will be picked up from your Next.js environment)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

// Match the FastAPI calculation response
type CalculationResponse = {
  average_latitude: number | null;
  average_longitude: number | null;
  count: number;
};

const generateMapLink = (lat: number, lon: number) => {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
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
      
      const res = await fetch(`${API_URL}/calculations`, {
        method: "POST", // must match FastAPI
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY ?? "",
        },
        // POST to /calculations doesn't require a body, but sending one can prevent 422 errors if FastAPI expects it
        body: JSON.stringify({}), 
      });

      if (!res.ok) {
        const errorDetail = await res.text();
        throw new Error(`Failed to fetch calculations. Status: ${res.status}. Detail: ${errorDetail.substring(0, 100)}...`);
      }
      
      const json: CalculationResponse = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching calculations:", err);
      if (err instanceof Error) {
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
  }, []);

  const getAndSendLocation = () => {
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

          // 3. IMPORTANT: Fetch updated calculations after a successful submission
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
    );
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
      <div className="bg-white shadow-2xl rounded-xl p-8 max-w-lg w-full transform transition-all duration-300 hover:shadow-3xl">
        <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-800 border-b pb-3">
          Global Coordinate Tracker
        </h1>

        <button
          onClick={getAndSendLocation}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl text-lg disabled:opacity-50 transition duration-150 shadow-md hover:shadow-lg mb-6"
        >
          {loading ? "⏳ Processing..." : "📍 Get & Send Location"}
        </button>

        {/* User's Last Sent Location */}
        {coords && (
          <div className="mb-6 p-6 bg-indigo-50 border-2 border-indigo-300 rounded-xl">
            <h2 className="font-bold text-xl mb-3 text-center text-indigo-800">Your Last Sent Coordinates</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                <span className="font-semibold text-gray-600">Latitude:</span> 
                <span className="font-mono text-indigo-600 text-base">{coords.latitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                <span className="font-semibold text-gray-600">Longitude:</span> 
                <span className="font-mono text-indigo-600 text-base">{coords.longitude.toFixed(6)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div className={`mt-4 p-4 rounded-lg text-center font-medium ${message.startsWith('❌') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            <p className="text-base">{message}</p>
          </div>
        )}

        {/* Initial Load Error Display */}
        {initialLoadError && (
          <div className="mt-4 p-4 bg-red-100 rounded-lg text-center font-medium text-red-700">
            <h2 className="font-bold">Initialization Error</h2>
            <p className="text-sm">{initialLoadError}</p>
          </div>
        )}


        {/* Global Calculation Data Display */}
        <div className="mt-6 border-t pt-6">
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-700">Global Average Data</h2>
            
            {!data && !initialLoadError && (
                <div className="p-4 bg-yellow-100 text-yellow-700 rounded-lg text-center">
                    <p>Fetching global data...</p>
                </div>
            )}

            {data && (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl shadow-inner">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                            <span className="font-semibold text-gray-600">Total Submissions:</span> 
                            <span className="font-extrabold text-2xl text-indigo-600">{data.count}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                            <span className="font-semibold text-gray-600">Avg. Latitude:</span> 
                            <span className="font-mono text-gray-800">
                                {data.average_latitude !== null ? data.average_latitude.toFixed(6) : "N/A"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                            <span className="font-semibold text-gray-600">Avg. Longitude:</span> 
                            <span className="font-mono text-gray-800">
                                {data.average_longitude !== null ? data.average_longitude.toFixed(6) : "N/A"}
                            </span>
                        </div>
                        <a 
                            href={generateMapLink(data.average_latitude!, data.average_longitude!)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-6 block text-center bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-150 shadow-md"
                        >
                            🌍 View Average Location on Map
                        </a>
                    </div>
                </div>
            )}
            {data  &&  (
                        <a 
                            href={generateMapLink(data.average_latitude!, data.average_longitude!)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-6 block text-center bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-150 shadow-md"
                        >
                            🌍 View Average Location on Map
                        </a>
                    )}
                    {/* --- NEW CODE ADDITION END --- */}
                    
        </div>
      </div>
    </main>
  );
}
