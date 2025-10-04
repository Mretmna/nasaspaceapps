'use client';
import { useState, useEffect } from 'react';

// Define the exact types for the API response expected from the FastAPI backend.
// This ensures type safety between the Python and TypeScript parts of your application.
type ApiResult = {
  received: {
    latitude: number;
    longitude: number;
  };
  calculations: {
    division: number | string; // Division could be a number or the 'zero division' string
  };
};

export default function Home() {
  const [coords, setCoords] = useState({ lat: 0, lon: 0 });
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // NOTE: process.env.NEXT_PUBLIC_API_URL is unused here because we use a relative path (/api/calculate/),
  // which is the best practice for deployment on Vercel. 
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  /**
   * Get the user's current geographic coordinates when the component mounts.
   */
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ 
          lat: pos.coords.latitude, 
          lon: pos.coords.longitude 
        });
      }, (err) => {
        // Optional: Handle geolocation errors
        console.error("Geolocation error:", err.message);
        setError("Could not retrieve location. Please check your browser settings.");
      });
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  }, []);

  /**
   * Sends the coordinates to the FastAPI backend deployed as a Vercel Serverless Function.
   */
  const sendCoordinates = async () => {
    setLoading(true);
    setError('');

    try {
      // Use the relative path. Vercel automatically routes this to your Python function.
      const apiPath = `/api/calculate/`; 

      console.log('Sending to:', apiPath);
      
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Include the API key if it exists in environment variables
          ...(API_KEY ? { 'x-api-key': API_KEY } : {})
        },
        body: JSON.stringify(coords)
      });

      if (!res.ok) {
        // Handle HTTP errors, including 401 Unauthorized from the FastAPI check
        const errorText = await res.text();
        throw new Error(`Request failed: ${res.status} - ${errorText || res.statusText}`);
      }

      const data: ApiResult = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Coordinate Processor</h1>

      <div className="bg-gray-100 p-4 rounded mb-6 border border-gray-300">
        <p className="font-semibold mb-2 text-gray-700">Your Coordinates (from Browser):</p>
        <p>Latitude: <span className="font-mono text-blue-600">{coords.lat.toFixed(6)}</span></p>
        <p>Longitude: <span className="font-mono text-blue-600">{coords.lon.toFixed(6)}</span></p>
      </div>

      <button
        onClick={sendCoordinates}
        disabled={loading || coords.lat === 0 && coords.lon === 0} // Disable if still loading or coordinates are (0, 0)
        className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md transition duration-150 ease-in-out hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'Send Coordinates to FastAPI'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-3 text-gray-900">Results from Python Backend:</h2>
          <pre className="p-4 bg-gray-800 text-green-400 rounded-lg overflow-auto text-sm shadow-inner">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}