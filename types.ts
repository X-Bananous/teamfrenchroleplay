export interface User {
  id: string;
  username: string;
  avatar: string;
  isStaff: boolean;
}

export enum CharacterStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export interface Character {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  birth_place: string;
  age: number;
  status: CharacterStatus;
  created_at: string;
}

export interface QueueEntry {
  user: string;
  status: 'queue' | 'ingame';
  time: string;
}
