export type InterviewStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'

export interface CalendarInterview {
  id: string
  applicantId: string
  applicantName: string
  applicantEmail: string
  jobId: string
  jobTitle: string
  scheduledDate: Date | string
  scheduledTime: string  // "14:00"
  duration: number        // minutes
  meetingLink: string
  notes?: string
  internalNotes?: string
  status: InterviewStatus
  scheduledBy: {
    id: string
    name: string
    email: string
  }
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  interviews: CalendarInterview[]
}

export interface CalendarFilters {
  statuses: Set<InterviewStatus>
  jobId: string | 'all'
  interviewerId: string | 'all'
  searchTerm: string
}

export type CalendarView = 'month' | 'week' | 'list'

export interface Job {
  id: string
  title: string
}

export interface Interviewer {
  id: string
  name: string
  email: string
}
