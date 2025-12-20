/**
 * SmartRecruit AI - Evaluation Processing API Route
 * Handles candidate evaluation triggers and processing
 */

import { Hono } from 'hono'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Evaluation from './evaluationSchema'
import Applicant from '../Applicants/applicantSchema'
import Response from '../Responses/responseSchema'
import Job from '../Jobs/jobSchema'
import {
    evaluateCandidate,
    batchEvaluateCandidates,
    quickScore,
    CandidateEvaluationInput,
} from '@/services/evaluation'

// Validation schemas
const processEvaluationSchema = z.object({
    applicantId: z.string().min(1, 'Applicant ID is required'),
    jobId: z.string().min(1, 'Job ID is required'),
})

const batchProcessSchema = z.object({
    jobId: z.string().min(1, 'Job ID is required'),
    applicantIds: z.array(z.string()).min(1, 'At least one applicant ID is required'),
})

const quickScoreSchema = z.object({
    yearsOfExperience: z.number().optional(),
    requiredExperience: z.number().default(0),
    skills: z.array(z.string()).default([]),
    requiredSkills: z.array(z.string()).default([]),
    preferredSkills: z.array(z.string()).default([]),
})

const app = new Hono()

/**
 * Helper function to build candidate data for evaluation
 */
async function buildCandidateData(
    applicantId: string,
    jobId: string
): Promise<CandidateEvaluationInput | null> {
    try {
        // Fetch applicant
        const applicant = await Applicant.findById(applicantId)
        if (!applicant) return null

        // Fetch job
        const job = await Job.findById(jobId)
        if (!job) return null

        // Fetch all responses for this applicant
        const responses = await Response.find({ applicantId })

        // Build voice responses
        const voiceResponses: CandidateEvaluationInput['voiceResponses'] = []
        const textResponses: CandidateEvaluationInput['textResponses'] = []

        // Get questions from job
        const questions = job.questions || []

        for (const response of responses) {
            const question = questions.find((q, index) => 
                response.questionId === `q_${index}` || response.questionId === q.text
            )
            
            if (response.type === 'voice' && response.audioUrl) {
                voiceResponses.push({
                    questionId: response.questionId,
                    questionText: question?.text || response.questionId,
                    questionWeight: question?.weight || 5,
                    audioUrl: response.audioUrl,
                })
            } else if (response.type === 'text' && response.textAnswer) {
                textResponses.push({
                    questionId: response.questionId,
                    questionText: question?.text || response.questionId,
                    answer: response.textAnswer,
                })
            }
        }

        // Build job criteria from job document
        const jobCriteria: CandidateEvaluationInput['jobCriteria'] = {
            title: job.title,
            description: job.description,
            skills: job.skills.map(s => ({
                name: s.name,
                importance: s.importance,
                type: s.type,
            })),
            minExperience: job.minExperience || 0,
            languages: job.languages.map(l => ({
                language: l.language,
                level: l.level,
            })),
            criteria: job.criteria.map(c => ({
                name: c.name,
                description: c.description,
                weight: c.weight,
                required: c.required,
            })),
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            autoRejectThreshold: job.autoRejectThreshold || 35,
        }

        return {
            applicantId,
            jobId,
            personalData: {
                name: applicant.personalData.name,
                email: applicant.personalData.email,
                phone: applicant.personalData.phone,
                age: applicant.personalData.age,
                yearsOfExperience: applicant.personalData.yearsOfExperience,
                salaryExpectation: applicant.personalData.salaryExpectation,
                linkedinUrl: applicant.personalData.linkedinUrl,
                behanceUrl: applicant.personalData.behanceUrl,
                portfolioUrl: applicant.personalData.portfolioUrl,
            },
            voiceResponses,
            textResponses,
            cvUrl: applicant.cvUrl,
            jobCriteria,
        }
    } catch (error) {
        console.error('[API] Error building candidate data:', error)
        return null
    }
}

/**
 * Process a single candidate evaluation
 * POST /process
 */
app.post('/process', async (c) => {
    try {
        await dbConnect()
        const body = await c.req.json()

        const validation = processEvaluationSchema.safeParse(body)
        if (!validation.success) {
            return c.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: validation.error.flatten().fieldErrors,
                },
                400
            )
        }

        const { applicantId, jobId } = validation.data

        // Check if applicant exists
        const applicant = await Applicant.findById(applicantId)
        if (!applicant) {
            return c.json(
                {
                    success: false,
                    error: 'Applicant not found',
                },
                404
            )
        }

        // Update applicant status to screening
        await Applicant.findByIdAndUpdate(applicantId, { status: 'screening' })

        // Build candidate data
        console.log('📋 [API] Building candidate data for applicant:', applicantId)
        const candidateData = await buildCandidateData(applicantId, jobId)
        if (!candidateData) {
            console.error('❌ [API] Failed to build candidate data')
            return c.json(
                {
                    success: false,
                    error: 'Failed to build candidate data',
                },
                500
            )
        }

        console.log('📋 [API] ============================================')
        console.log('📋 [API] Starting evaluation for:', applicant.personalData.name)
        console.log('📋 [API] Applicant ID:', applicantId)
        console.log('📋 [API] Job ID:', jobId)
        console.log('📋 [API] Voice responses count:', candidateData.voiceResponses.length)
        console.log('📋 [API] Text responses count:', candidateData.textResponses.length)
        console.log('📋 [API] Has CV:', !!candidateData.cvUrl)
        
        if (candidateData.voiceResponses.length > 0) {
            console.log('📋 [API] Voice response URLs:')
            candidateData.voiceResponses.forEach((vr, idx) => {
                console.log(`   ${idx + 1}. ${vr.audioUrl}`)
            })
        }
        console.log('📋 [API] ============================================')

        // Run the evaluation
        const result = await evaluateCandidate(candidateData)
        
        console.log('📋 [API] Evaluation completed')
        console.log('📋 [API] Success:', result.success)
        if (!result.success) {
            console.error('❌ [API] Evaluation error:', result.error)
        }

        if (!result.success || !result.evaluation) {
            // Update applicant status
            await Applicant.findByIdAndUpdate(applicantId, { 
                status: 'new',
                notes: `Evaluation failed: ${result.error}`,
            })

            return c.json(
                {
                    success: false,
                    error: result.error || 'Evaluation failed',
                },
                500
            )
        }

        // Save evaluation to database
        const existingEval = await Evaluation.findOne({ applicantId })

        if (existingEval) {
            // Update existing evaluation
            Object.assign(existingEval, {
                overallScore: result.evaluation.overallScore,
                criteriaMatches: result.evaluation.criteriaMatches,
                strengths: result.evaluation.strengths,
                weaknesses: result.evaluation.weaknesses,
                redFlags: result.evaluation.redFlags,
                summary: result.evaluation.summary,
                recommendation: result.evaluation.recommendation,
                recommendationReason: result.evaluation.recommendationReason,
                suggestedQuestions: result.evaluation.suggestedQuestions,
                sentimentScore: result.evaluation.sentimentScore,
                confidenceScore: result.evaluation.confidenceScore,
                isProcessed: true,
                processedAt: new Date(),
            })
            await existingEval.save()
        } else {
            // Create new evaluation
            await Evaluation.create({
                applicantId,
                jobId,
                overallScore: result.evaluation.overallScore,
                criteriaMatches: result.evaluation.criteriaMatches,
                strengths: result.evaluation.strengths,
                weaknesses: result.evaluation.weaknesses,
                redFlags: result.evaluation.redFlags,
                summary: result.evaluation.summary,
                recommendation: result.evaluation.recommendation,
                recommendationReason: result.evaluation.recommendationReason,
                suggestedQuestions: result.evaluation.suggestedQuestions,
                sentimentScore: result.evaluation.sentimentScore,
                confidenceScore: result.evaluation.confidenceScore,
                isProcessed: true,
                processedAt: new Date(),
            })
        }

        // Update applicant with evaluation results
        await Applicant.findByIdAndUpdate(applicantId, {
            status: 'evaluated',
            aiScore: result.evaluation.overallScore,
            aiSummary: result.evaluation.summary,
            aiRedFlags: result.evaluation.redFlags,
            cvParsedData: result.evaluation.parsedResume,
        })

        // Update voice response transcripts
        for (const transcript of result.evaluation.transcripts) {
            await Response.findOneAndUpdate(
                { applicantId, questionId: transcript.questionId },
                {
                    rawTranscript: transcript.rawTranscript,
                    cleanTranscript: transcript.cleanTranscript,
                }
            )
        }

        console.log('[API] Evaluation completed successfully')
        console.log('[API] Score:', result.evaluation.overallScore)
        console.log('[API] Recommendation:', result.evaluation.recommendation)

        return c.json({
            success: true,
            message: 'Evaluation completed successfully',
            evaluation: {
                id: existingEval?._id.toString() || 'new',
                overallScore: result.evaluation.overallScore,
                recommendation: result.evaluation.recommendation,
                summary: result.evaluation.summary,
                processingTime: result.processingTime,
            },
        })
    } catch (error) {
        console.error('[API] Process evaluation error:', error)
        return c.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

/**
 * Batch process multiple candidates
 * POST /batch-process
 */
app.post('/batch-process', async (c) => {
    try {
        await dbConnect()
        const body = await c.req.json()

        const validation = batchProcessSchema.safeParse(body)
        if (!validation.success) {
            return c.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: validation.error.flatten().fieldErrors,
                },
                400
            )
        }

        const { jobId, applicantIds } = validation.data

        console.log('[API] Starting batch evaluation for', applicantIds.length, 'candidates')

        // Run batch evaluation
        const result = await batchEvaluateCandidates(
            { jobId, applicantIds },
            buildCandidateData
        )

        // Save results for each successful evaluation
        for (const evalResult of result.results) {
            if (evalResult.success) {
                // Results are already saved in the evaluateCandidate function
                console.log('[API] Batch: Candidate', evalResult.applicantId, 'processed')
            } else {
                console.warn('[API] Batch: Candidate', evalResult.applicantId, 'failed:', evalResult.error)
            }
        }

        return c.json({
            success: true,
            message: `Processed ${result.totalProcessed} candidates`,
            results: {
                total: result.totalProcessed,
                successful: result.totalProcessed - result.totalFailed,
                failed: result.totalFailed,
                details: result.results,
            },
        })
    } catch (error) {
        console.error('[API] Batch process error:', error)
        return c.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

/**
 * Quick score calculation for filtering
 * POST /quick-score
 */
app.post('/quick-score', async (c) => {
    try {
        const body = await c.req.json()

        const validation = quickScoreSchema.safeParse(body)
        if (!validation.success) {
            return c.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: validation.error.flatten().fieldErrors,
                },
                400
            )
        }

        const score = await quickScore(validation.data)

        return c.json({
            success: true,
            score,
        })
    } catch (error) {
        console.error('[API] Quick score error:', error)
        return c.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

/**
 * Trigger evaluation for all pending applicants of a job
 * POST /process-all/:jobId
 */
app.post('/process-all/:jobId', async (c) => {
    try {
        await dbConnect()
        const jobId = c.req.param('jobId')

        // Find all applicants for this job that haven't been evaluated
        const pendingApplicants = await Applicant.find({
            jobId,
            status: { $in: ['new', 'screening'] },
            isComplete: true,
        }).select('_id')

        if (pendingApplicants.length === 0) {
            return c.json({
                success: true,
                message: 'No pending applicants to evaluate',
                count: 0,
            })
        }

        const applicantIds = pendingApplicants.map(a => a._id.toString())

        console.log('[API] Auto-processing', applicantIds.length, 'pending applicants for job:', jobId)

        // Run batch evaluation
        const result = await batchEvaluateCandidates(
            { jobId, applicantIds },
            buildCandidateData
        )

        return c.json({
            success: true,
            message: `Processed ${result.totalProcessed} candidates`,
            results: {
                total: result.totalProcessed,
                successful: result.totalProcessed - result.totalFailed,
                failed: result.totalFailed,
            },
        })
    } catch (error) {
        console.error('[API] Process all error:', error)
        return c.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

/**
 * Re-evaluate a candidate
 * POST /re-evaluate/:applicantId
 */
app.post('/re-evaluate/:applicantId', async (c) => {
    try {
        await dbConnect()
        const applicantId = c.req.param('applicantId')

        // Find applicant and their job
        const applicant = await Applicant.findById(applicantId)
        if (!applicant) {
            return c.json(
                {
                    success: false,
                    error: 'Applicant not found',
                },
                404
            )
        }

        const jobId = applicant.jobId.toString()

        console.log('[API] Re-evaluating applicant:', applicant.personalData.name)

        // Build candidate data and run evaluation
        const candidateData = await buildCandidateData(applicantId, jobId)
        if (!candidateData) {
            return c.json(
                {
                    success: false,
                    error: 'Failed to build candidate data',
                },
                500
            )
        }

        const result = await evaluateCandidate(candidateData)

        if (!result.success || !result.evaluation) {
            return c.json(
                {
                    success: false,
                    error: result.error || 'Re-evaluation failed',
                },
                500
            )
        }

        // Update evaluation
        await Evaluation.findOneAndUpdate(
            { applicantId },
            {
                overallScore: result.evaluation.overallScore,
                criteriaMatches: result.evaluation.criteriaMatches,
                strengths: result.evaluation.strengths,
                weaknesses: result.evaluation.weaknesses,
                redFlags: result.evaluation.redFlags,
                summary: result.evaluation.summary,
                recommendation: result.evaluation.recommendation,
                recommendationReason: result.evaluation.recommendationReason,
                suggestedQuestions: result.evaluation.suggestedQuestions,
                sentimentScore: result.evaluation.sentimentScore,
                confidenceScore: result.evaluation.confidenceScore,
                isProcessed: true,
                processedAt: new Date(),
            },
            { upsert: true }
        )

        // Update applicant
        await Applicant.findByIdAndUpdate(applicantId, {
            aiScore: result.evaluation.overallScore,
            aiSummary: result.evaluation.summary,
            aiRedFlags: result.evaluation.redFlags,
        })

        return c.json({
            success: true,
            message: 'Re-evaluation completed',
            evaluation: {
                overallScore: result.evaluation.overallScore,
                recommendation: result.evaluation.recommendation,
                processingTime: result.processingTime,
            },
        })
    } catch (error) {
        console.error('[API] Re-evaluate error:', error)
        return c.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

/**
 * Get evaluation status for an applicant
 * GET /status/:applicantId
 */
app.get('/status/:applicantId', async (c) => {
    try {
        await dbConnect()
        const applicantId = c.req.param('applicantId')

        const evaluation = await Evaluation.findOne({ applicantId })

        if (!evaluation) {
            return c.json({
                success: true,
                status: 'not_evaluated',
                hasEvaluation: false,
            })
        }

        return c.json({
            success: true,
            status: evaluation.isProcessed ? 'completed' : 'processing',
            hasEvaluation: true,
            evaluation: {
                id: evaluation._id.toString(),
                overallScore: evaluation.overallScore,
                recommendation: evaluation.recommendation,
                isProcessed: evaluation.isProcessed,
                processedAt: evaluation.processedAt,
                hasError: !!evaluation.processingError,
                error: evaluation.processingError,
            },
        })
    } catch (error) {
        console.error('[API] Status check error:', error)
        return c.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

export default app

