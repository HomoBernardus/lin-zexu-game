import { GameEvent } from '@/types/game';
import week1Data from './week1.json';
import week2Data from './week2.json';
import week3Data from './week3.json';
import week4Data from './week4.json';

function addWeek(events: Record<string, unknown>[], week: number): GameEvent[] {
  return events.map(e => ({ ...e, week } as unknown as GameEvent));
}

export const week1Events = addWeek(week1Data.events, 1);
export const week2Events = addWeek(week2Data.events, 2);
export const week3Events = addWeek(week3Data.events, 3);
export const week4Events = addWeek(week4Data.events, 4);
