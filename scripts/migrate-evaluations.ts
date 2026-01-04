/**
 * Migration Script: Update existing evaluations with AI analysis breakdown
 *
 * This script generates aiAnalysisBreakdown from existing applicant data
 * WITHOUT making new AI API calls (uses skipGeminiCalls = true).
 *
 * Run with: bun run scripts/migrate-evaluations.ts
 */

import dbConnect from '../src/lib/mongodb'
import Applicant from '../src/models/Applicants/applicantSchema'
import Evaluation from '../src/models/Evaluations/evaluationSchema'
import Job from '../src/models/Jobs/jobSchema'
import Response from '../src/models/Responses/responseSchema'
import { buildAIAnalysisBreakdown } from '../src/services/evaluation/scoringEngine'

async function migrateEvaluations() {
    console.log('🚀 Starting evaluation migration (no AI calls mode)...\n')

    await dbConnect()

    // Find all applicants that have been evaluated
    const applicants = await Applicant.find({
        $or: [
            { aiScore: { $exists: true } },
            { status: { $in: ['evaluated', 'interview', 'offer', 'hired', 'rejected'] } }
        ]
    }).lean()

    console.log(`📋 Found ${applicants.length} applicants to process\n`)

    let updated = 0
    let skipped = 0
    let errors = 0

    for (const app of applicants) {
        const applicant = app as any // Cast to any for flexible property access
        try {
            const applicantId = applicant._id.toString()
            console.log(`\n📝 Processing: ${applicant.personalData?.fullName || applicantId}`)

            // Get job data
            const jobId = applicant.jobId?.toString()
            if (!jobId) {
                console.log('  ⚠️ No job ID - skipping')
                skipped++
                continue
            }

            const jobDoc = await Job.findById(jobId).lean()
            if (!jobDoc) {
                console.log('  ⚠️ Job not found - skipping')
                skipped++
                continue
            }
            const job = jobDoc as any // Cast to any for flexible property access

            // Get existing evaluation
            const existingEval = await Evaluation.findOne({ applicantId }).lean() as any

            // Fetch responses from the separate collection
            const responses = await Response.find({ applicantId: applicant._id }).lean()
            const voiceResponses = responses.filter((r: any) => r.type === 'voice')
            const textResponses = responses.filter((r: any) => r.type === 'text')

            console.log(`  📊 Found ${voiceResponses.length} voice, ${textResponses.length} text responses`)

            // Build question map from job data
            const questionMap: Record<string, { text: string; weight: number }> = {}
            if (job.voiceQuestions) {
                job.voiceQuestions.forEach((q: any, idx: number) => {
                    questionMap[q.id || `voice_${idx}`] = {
                        text: typeof q.question === 'object' ? q.question.en || q.question.ar || '' : q.question || '',
                        weight: q.weight || 5
                    }
                })
            }
            if (job.textQuestions) {
                job.textQuestions.forEach((q: any, idx: number) => {
                    questionMap[q.id || `text_${idx}`] = {
                        text: typeof q.question === 'object' ? q.question.en || q.question.ar || '' : q.question || '',
                        weight: q.weight || 5
                    }
                })
            }

            // Prepare candidate data with responses
            const candidateData = {
                personalData: applicant.personalData || {},
                voiceAnalysis: voiceResponses.map((vr: any) => {
                    const questionInfo = questionMap[vr.questionId] || { text: `Question ${vr.questionId}`, weight: 5 }
                    return {
                        questionId: vr.questionId,
                        questionText: questionInfo.text,
                        questionWeight: questionInfo.weight,
                        transcript: vr.cleanTranscript || vr.rawTranscript || '',
                        analysis: {
                            sentiment: { label: 'neutral' },
                            confidence: { score: 70 }
                        },
                    }
                }),
                textResponses: textResponses.map((tr: any) => {
                    const questionInfo = questionMap[tr.questionId] || { text: `Question ${tr.questionId}`, weight: 5 }
                    return {
                        questionId: tr.questionId,
                        questionText: questionInfo.text,
                        questionWeight: questionInfo.weight,
                        answer: tr.textAnswer || '',
                        weight: questionInfo.weight,
                    }
                }),
                additionalNotes: applicant.notes || applicant.additionalNotes || '',
                externalProfiles: {
                    linkedinUrl: applicant.personalData?.linkedinUrl,
                    githubUrl: applicant.personalData?.githubUrl,
                    portfolioUrl: applicant.personalData?.portfolioUrl,
                },
            }

            // Prepare job criteria
            const jobCriteria = {
                title: job.title || '',
                description: job.description || '',
                criteria: job.criteria?.map((c: any) => ({
                    name: c.name,
                    weight: c.weight || 5,
                    required: c.required || false,
                })) || [],
                screeningQuestions: job.screeningQuestions?.map((sq: any) => ({
                    question: sq.question,
                    idealAnswer: sq.idealAnswer,
                    disqualify: sq.disqualify || false,
                })) || [],
                languages: job.languages || [],
                skills: job.skills || [],
                experience: {
                    minYears: job.minExperience || 0,
                    maxYears: job.maxExperience || 99,
                },
                autoRejectThreshold: job.autoRejectThreshold || 40,
            }

            console.log('  📊 Building AI breakdown from existing data...')

            // Build existing scoring result from current data
            const existingScoringResult = {
                success: true,
                overallScore: existingEval?.overallScore || applicant.aiScore || 0,
                criteriaMatches: existingEval?.criteriaMatches || [],
                strengths: existingEval?.strengths || { en: [], ar: [] },
                weaknesses: existingEval?.weaknesses || { en: [], ar: [] },
                redFlags: existingEval?.redFlags || { en: [], ar: [] },
                summary: existingEval?.summary || { en: '', ar: '' },
                whySection: existingEval?.whySection || { en: '', ar: '' },
            }

            // Build breakdown WITHOUT making AI calls
            const aiAnalysisBreakdown = await buildAIAnalysisBreakdown(
                candidateData as any,
                jobCriteria as any,
                existingScoringResult as any,
                true // skipGeminiCalls = true
            )

            console.log('  ✓ Breakdown sections generated:')
            if (aiAnalysisBreakdown.screeningQuestionsAnalysis) console.log('    - Screening Questions')
            if (aiAnalysisBreakdown.voiceResponsesAnalysis) console.log(`    - Voice Responses (${aiAnalysisBreakdown.voiceResponsesAnalysis.totalResponses})`)
            if (aiAnalysisBreakdown.textResponsesAnalysis) console.log(`    - Text Responses (${aiAnalysisBreakdown.textResponsesAnalysis.totalResponses})`)
            if (aiAnalysisBreakdown.languageRequirementsAnalysis) console.log('    - Language Requirements')
            if (aiAnalysisBreakdown.experienceAnalysis) console.log('    - Experience Analysis')
            if (aiAnalysisBreakdown.scoringBreakdown) console.log('    - Scoring Breakdown')

            // Update evaluation with breakdown
            await Evaluation.findOneAndUpdate(
                { applicantId },
                {
                    $set: {
                        aiAnalysisBreakdown: aiAnalysisBreakdown,
                        updatedAt: new Date(),
                    }
                },
                { upsert: true }
            )

            console.log(`  ✅ Updated successfully`)
            updated++

        } catch (error) {
            console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            errors++
        }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 Migration Summary:')
    console.log(`   ✅ Updated: ${updated}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log('='.repeat(50) + '\n')

    process.exit(0)
}

migrateEvaluations().catch(error => {
    console.error('Migration failed:', error)
    process.exit(1)
})
