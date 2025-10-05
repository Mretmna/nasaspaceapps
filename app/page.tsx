'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

// adjust to match your FastAPI response structure
type CalculationResponse = {
  result: number;  
};

export default function Home() {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CalculationResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/calculations`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY ?? '',
          },
        });
        if (!res.ok) throw new Error('Failed to fetch');

        const json: CalculationResponse = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const getAndSendLocation = () => {
    setLoading(true);
    setMessage('Getting your location...');
    setCoords(null);

    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Display coordinates first
        setCoords({ latitude, longitude });
        setMessage('📍 Location received! Sending to server...');

        // Then send to API
        try {
          const response = await fetch(`${API_URL}/coords`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': API_KEY ?? '',
            },
            body: JSON.stringify({ latitude, longitude }),
          });

          if (!response.ok) throw new Error('Failed to send location');

          await response.json();
          setMessage('✅ Location sent successfully!');
        } catch (error) {
          setMessage('❌ Failed to send location to server');
        }
        setLoading(false);
      },
      (error) => {
        setMessage(`❌ Error: ${error.message}`);
        setLoading(false);
      }
    );
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Send My Location</h1>

        <button
          onClick={getAndSendLocation}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg text-lg disabled:opacity-50 mb-4"
        >
          {loading ? '⏳ Processing...' : '📍 Get & Send Location'}
        </button>

        {coords && (
          <div className="mb-4 p-6 bg-blue-50 border-2 border-blue-300 rounded-lg">
            <h2 className="font-bold text-lg mb-2 text-center">Your Coordinates</h2>
            <div className="space-y-2 font-mono text-sm">
              <div className="bg-white p-3 rounded">
                <span className="font-bold">Latitude:</span> {coords.latitude.toFixed(6)}
              </div>
              <div className="bg-white p-3 rounded">
                <span className="font-bold">Longitude:</span> {coords.longitude.toFixed(6)}
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-sm">{message}</p>
          </div>
        )}

        {data && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg text-center">
            <p className="text-sm">Calculation result: {data.result}</p>
          </div>
        )}
      </div>
    </main>
  );
}
