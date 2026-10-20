export interface AttemptOption {
  id: string
  body: string
  sort_order: number
  is_correct?: boolean | null
}

export interface AttemptQuestion {
  id: string
  topic_id: string
  position: number
  body: string
  explanation?: string | null
  difficulty: string
  image_url?: string | null
  options: AttemptOption[]
  selected_option_ids?: string[] | null
  is_correct?: boolean | null
}

export interface Attempt {
  id: string
  certification_id: string
  topic_id?: string | null
  mode: 'exam' | 'learning'
  question_count: number
  only_mistakes: boolean
  score?: number | null
  correct_count?: number | null
  started_at: string
  completed_at?: string | null
  duration_seconds?: number | null
  questions?: AttemptQuestion[]
}

export interface StartAttemptInput {
  mode: 'exam' | 'learning'
  topic_id?: string
  only_mistakes?: boolean
  question_count?: number
}
