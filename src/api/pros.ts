import type { ProPlayer } from '../data/proPlayers';

const API_URL = 'http://127.0.0.1:8000';

// Gets every pro player from the FastAPI backend (GET /pros)
export async function fetchPros(): Promise<ProPlayer[]> {
    const response = await fetch(`${API_URL}/pros`);
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }
    return response.json();
}