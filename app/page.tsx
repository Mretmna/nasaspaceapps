'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [coords, setCoords] = useState({ lat: 0, lon: 0 });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ 
          lat: pos.coords.latitude, 
          lon: pos.coords.longitude 
        });
      });
    }
  }, []);

  const sendCoordinates = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('Sending to:', `${API_URL}/api/calculate`);
      console.log('Coordinates:', { lat: coords.lat, lon: coords.lon });
      
      const res = await fetch(`${API_URL}/api/calculate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY 
        },
        body: JSON.stringify({ 
          lat: coords.lat, 
          lon: coords.lon 
        })
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Coordinate Processor</h1>

      <div className="bg-black-100 p-4 rounded mb-6">
        <p className="font-semibold mb-2">Your Coordinates:</p>
        <p>Latitude: {coords.lat.toFixed(6)}</p>
        <p>Longitude: {coords.lon.toFixed(6)}</p>
      </div>

      <button
        onClick={sendCoordinates}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Processing...' : 'Send to Python'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-3">Results from Python:</h2>
          <pre className="p-4 bg-black-100 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}