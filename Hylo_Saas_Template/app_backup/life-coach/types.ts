// General profile types
export type LifeCoachProfileType = {
  id: string;
  userId: string;
  goals: string[];
  focusAreas: string[];
  personalValues: string[];
  checkInFrequency: string;
  preferredCheckInTime: string;
};

// Check-in types
export type LifeCoachCheckInType = {
  id: string;
  profileId: string;
  checkInDate: Date;
  mood: number;
  energy: number;
  focus: number;
  stress: number;
  sleep?: number;
  dailyWin?: string;
  dailyChallenge?: string;
  gratitude?: string;
  intentions?: string;
  tags: string[];
  aiAnalysis?: any;
};

export type AIAnalysisType = {
  summary: string;
  patterns: string[];
  recommendations: string[];
  positiveReinforcement: string[];
  areasForGrowth: string[];
};

// Reflection types
export type LifeCoachReflectionType = {
  id: string;
  profileId: string;
  reflectionType: string;
  startDate: Date;
  endDate: Date;
  summary: string;
  insights: string[];
  strengths: string[];
  improvements: string[];
  recommendations: string[];
};

// Achievement types
export type LifeCoachAchievementType = {
  id: string;
  profileId: string;
  title: string;
  description: string;
  achievedDate: Date;
  category: string;
  celebrationType?: string;
};

// Insight types
export type LifeCoachInsightType = {
  id: string;
  profileId: string;
  insightType: string;
  content: string;
  relatedCheckIns: string[];
  status: string;
};

// Input types for actions and queries
export type CreateOrUpdateLifeCoachProfileInput = {
  goals: string[];
  focusAreas: string[];
  personalValues: string[];
  checkInFrequency: string;
  preferredCheckInTime: string;
};

export type GetLifeCoachCheckInsInput = {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
};

export type CreateLifeCoachCheckInInput = {
  mood: number;
  energy: number;
  focus: number;
  stress: number;
  sleep?: number;
  dailyWin?: string;
  dailyChallenge?: string;
  gratitude?: string;
  intentions?: string;
  tags: string[];
};

export type GetLifeCoachReflectionsInput = {
  page?: number;
  limit?: number;
  reflectionType?: string;
};

export type GenerateLifeCoachReflectionInput = {
  reflectionType: string;
  startDate: string;
  endDate: string;
};

export type GetLifeCoachAchievementsInput = {
  page?: number;
  limit?: number;
  category?: string;
};

export type CreateLifeCoachAchievementInput = {
  title: string;
  description: string;
  achievedDate: string;
  category: string;
  celebrationType?: string;
};

export type GetLifeCoachInsightsInput = {
  page?: number;
  limit?: number;
  status?: string;
  insightType?: string;
};

export type UpdateLifeCoachInsightStatusInput = {
  insightId: string;
  status: string;
};

// Response types with pagination
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
};

// Constants
export const FOCUS_AREAS = [
  'Career',
  'Health',
  'Relationships',
  'Personal Growth',
  'Finances',
  'Spirituality',
  'Recreation',
  'Contribution'
];

export const PERSONAL_VALUES = [
  'Authenticity',
  'Balance',
  'Compassion',
  'Creativity',
  'Determination',
  'Freedom',
  'Growth',
  'Happiness',
  'Health',
  'Honesty',
  'Justice',
  'Kindness',
  'Leadership',
  'Love',
  'Respect',
  'Security',
  'Service',
  'Success',
  'Wisdom'
];

export const MOOD_EMOJIS = [
  '😫', '😔', '😕', '😐', '🙂', '😊', '😃', '😄', '😁', '🤩'
];

export const ACHIEVEMENT_CATEGORIES = [
  'Career',
  'Health',
  'Relationships',
  'Personal Growth',
  'Finances',
  'Creative',
  'Learning',
  'Mindfulness'
];

export const INSIGHT_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'implemented', label: 'Implemented' },
  { value: 'dismissed', label: 'Dismissed' }
]; 