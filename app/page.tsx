'use client';

import { useState, useEffect } from 'react';
import { fetchItems, addCurrentLocation, clearItems } from '@/lib/api';

export default function Home() {
  const [items, setItems] = useState<Array<{latitude: number; longitude: number; id: number}>>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await fetchItems();
      setItems(data.items);
      setMessage(`Loaded ${data.count} locations`);
    } catch (error) {
      setMessage('Failed to load locations');
    }
    setLoading(false);
  };

  const handleGetMyLocation = async () => {
    setLoading(true);
    setMessage('Getting your location...');
    try {
      const result = await addCurrentLocation();
      setMessage(`Location added! Lat: ${result.item.latitude}, Lon: ${result.item.longitude}`);
      loadItems();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Failed to get location');
    }
    setLoading(false);
  };

  const handleClear = async () => {
    setLoading(true);
    try {
      const result = await clearItems();
      setMessage(result.message);
      setItems([]);
    } catch (error) {
      setMessage('Failed to clear items');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Locations</h1>
      
      {message && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Your Current Location</h2>
        <button
          onClick={handleGetMyLocation}
          disabled={loading}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded text-lg"
        >
          📍 Get My Location
        </button>
        <p className="text-gray-600 text-sm mt-2">
          Click to share your current location and save it
        </p>
      </div>

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Saved Locations ({items.length})</h2>
          <button
            onClick={handleClear}
            disabled={loading || items.length === 0}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
          >
            Clear All
          </button>
        </div>
        
        {items.length === 0 ? (
          <p className="text-gray-500">No locations saved yet.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="border-l-4 border-green-500 pl-4 py-2 bg-gray-50">
                <span className="font-mono text-sm">
                  📍 Lat: {item.latitude.toFixed(6)}, Lon: {item.longitude.toFixed(6)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}