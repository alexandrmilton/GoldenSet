/**
 * Placeholder data for Phase 2 — the screen is built against the design first,
 * then wired to Supabase in Phase 4. Names mirror the design reference.
 */

export type MockPlayer = {
  rank: number;
  name: string;
  city: string;
  points: number;
  delta: number;
};

export const MOCK_PLAYERS: MockPlayer[] = [
  { rank: 1, name: 'Max Volyn', city: 'Київ', points: 2487, delta: 24 },
  { rank: 2, name: 'Olya Serve', city: 'Львів', points: 2341, delta: 18 },
  { rank: 3, name: 'Dmytro Ace', city: 'Харків', points: 2278, delta: 15 },
  { rank: 4, name: 'Lena Topspin', city: 'Одеса', points: 2156, delta: 12 },
  { rank: 5, name: 'Iron Backhand', city: 'Дніпро', points: 2043, delta: 9 },
  { rank: 6, name: 'Kyiv Smash', city: 'Київ', points: 1987, delta: -7 },
];

export const MOCK_TOURNAMENT = {
  name: 'Кубок Літа',
  meta: '15–16 червня · Київ',
};
