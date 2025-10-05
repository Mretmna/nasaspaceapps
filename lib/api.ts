const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Item {
  latitude: number;
  longitude: number;
  id: number;
}

interface ItemsResponse {
  items: Item[];
  count: number;
}

interface AddItemResponse {
  message: string;
  item: Item;
  total: number;
}

interface ClearResponse {
  message: string;
}

export async function fetchItems(): Promise<ItemsResponse> {
  const res = await fetch(`${API_URL}/items`);
  
  if (!res.ok) throw new Error('Failed to fetch items');
  return res.json();
}

export async function addItem(latitude: number, longitude: number): Promise<AddItemResponse> {
  const res = await fetch(`${API_URL}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ latitude, longitude }),
  });
  
  if (!res.ok) throw new Error('Failed to add item');
  return res.json();
}

export async function addCurrentLocation(): Promise<AddItemResponse> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await addItem(
            position.coords.latitude,
            position.coords.longitude
          );
          resolve(result);
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        reject(new Error('Failed to get location: ' + error.message));
      }
    );
  });
}

export async function clearItems(): Promise<ClearResponse> {
  const res = await fetch(`${API_URL}/items`, {
    method: 'DELETE',
  });
  
  if (!res.ok) throw new Error('Failed to clear items');
  return res.json();
}