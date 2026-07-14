export const MAX_RECOMMENDED_PEOPLE = 5

export const PEOPLE_DETECTED_AUDIO_BY_COUNT: Record<number, string> = {
  1: "/audio/people-detected/people-detected-1.mp3",
  2: "/audio/people-detected/people-detected-2.mp3",
  3: "/audio/people-detected/people-detected-3.mp3",
  4: "/audio/people-detected/people-detected-4.mp3",
  5: "/audio/people-detected/people-detected-5.mp3",
}

export function clampRecommendedPeopleCount(count: number) {
  if (!Number.isFinite(count)) {
    return 0
  }

  return Math.min(Math.max(Math.round(count), 0), MAX_RECOMMENDED_PEOPLE)
}
