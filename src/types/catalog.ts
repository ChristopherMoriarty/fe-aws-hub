export interface Certification {
  id: string
  code: string
  title: string
  question_count: number
  duration_seconds: number
  passing_percent: number
}

export interface Topic {
  id: string
  certification_id: string
  title: string
  sort_order: number
}

export interface TopicProgress {
  topic_id: string
  title: string
  sort_order: number
  total_questions: number
  attempted_questions: number
  mastered_questions: number
  accuracy: number
  mastered: boolean
}

export interface CertificationStats {
  total_questions: number
  attempted_questions: number
  mastered_questions: number
  needs_review: number
  exam_count: number
  total_attempts: number
  correct_answers: number
  accuracy: number
}

export interface User {
  id: string
  email: string
  role: string
}
