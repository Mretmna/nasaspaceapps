'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ;

export default function Home() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const getAndSendLocation = () => {
    setLoading(true);
    setMessage('Getting your location...');

    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(`${API_URL}/items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ latitude, longitude }),
          });

          if (!response.ok) throw new Error('Failed to send location');

          const data = await response.json();
          setMessage(`✅ Location sent! Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`);
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
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg text-lg disabled:opacity-50"
        >
          {loading ? '⏳ Sending...' : '📍 Send My Location'}
        </button>

        {message && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-sm">{message}</p>
          </div>
        )}
      </div>
    </main>
  );
}