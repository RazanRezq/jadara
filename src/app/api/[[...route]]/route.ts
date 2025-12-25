import { Hono } from 'hono'
import { handle } from 'hono/vercel'

import users from '@/models/Users/route'
import jobs from '@/models/Jobs/route'
import questions from '@/models/Questions/route'
import applicants from '@/models/Applicants/route'
import responses from '@/models/Responses/route'
import evaluations from '@/models/Evaluations/route'
import evaluationProcessing from '@/models/Evaluations/evaluationProcessingRoute'
import companyProfile from '@/models/CompanyProfile/route'
import notifications from '@/models/Notifications/route'

const app = new Hono().basePath('/api')

const routes = app
    .route('/users', users)
    .route('/jobs', jobs)
    .route('/questions', questions)
    .route('/applicants', applicants)
    .route('/responses', responses)
    .route('/evaluations', evaluations)
    .route('/ai/evaluate', evaluationProcessing)
    .route('/company', companyProfile)
    .route('/notifications', notifications)

export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)

export type AppType = typeof routes
