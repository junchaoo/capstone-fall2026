import type { LeaderboardEntry } from '../data/leaderboard';

const API_URL = 'http://127.0.0.1:8000';

export interface LeaderboardResponse {
    updatedAt: string | null;   //when the backend last fetched the data from riot
    entries: LeaderboardEntry[];
}

export async function fetchLeaderboard(): Promise<LeaderboardResponse> {
    const response = await fetch(`${API_URL}/leaderboard`);
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }
    return response.json();
}