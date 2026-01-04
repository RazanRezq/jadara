/**
 * Migration Script: Enhanced AI evaluation with full API calls
 *
 * This script re-evaluates all existing applicants with the NEW Google API key
 * to generate comprehensive AI analysis with detailed insights.
 *
 * Run with: bun run scripts/migrate-evaluations-enhanced.ts
 */

import dbConnect from '../src/lib/mongodb'
import Applicant from '../src/models/Applicants/applicantSchema'
import Evaluation from '../src/models/Evaluations/evaluationSchema'
import Job from '../src/models/Jobs/jobSchema'
import Response from '../src/models/Responses/responseSchema'
import { scoreCandidate } from '../src/services/evaluation/scoringEngine'

async function migrateEvaluations() {
    console.log('🚀 Starting ENHANCED evaluation migration with full AI analysis...\n')

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
        const applicant = app as any
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
            const job = jobDoc as any

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
                salaryMin: job.salaryMin || 0,
                salaryMax: job.salaryMax || 999999,
                autoRejectThreshold: job.autoRejectThreshold || 40,
            }

            console.log('  🤖 Running FULL AI evaluation with Gemini 2.5 Flash Native Audio Dialog...')

            // Run FULL evaluation with AI calls
            const result = await scoreCandidate(candidateData as any, jobCriteria as any)

            if (!result.success) {
                console.log(`  ❌ Evaluation failed: ${result.error}`)
                errors++
                continue
            }

            // Generate recommendation based on score
            const recommendation = result.overallScore >= 80 ? 'hire' :
                                  result.overallScore >= 60 ? 'hold' : 'reject'

            console.log('  ✓ AI Analysis breakdown sections:')
            if (result.aiAnalysisBreakdown?.screeningQuestionsAnalysis) console.log('    - Screening Questions ✓')
            if (result.aiAnalysisBreakdown?.voiceResponsesAnalysis) console.log(`    - Voice Responses (${result.aiAnalysisBreakdown.voiceResponsesAnalysis.totalResponses}) ✓`)
            if (result.aiAnalysisBreakdown?.textResponsesAnalysis) console.log(`    - Text Responses (${result.aiAnalysisBreakdown.textResponsesAnalysis.totalResponses}) ✓`)
            if (result.aiAnalysisBreakdown?.languageRequirementsAnalysis) console.log('    - Language Requirements ✓')
            if (result.aiAnalysisBreakdown?.experienceAnalysis) console.log('    - Experience Analysis ✓')
            if (result.aiAnalysisBreakdown?.scoringBreakdown) console.log('    - Scoring Breakdown ✓')

            // Update evaluation with new comprehensive data
            await Evaluation.findOneAndUpdate(
                { applicantId },
                {
                    $set: {
                        aiAnalysisBreakdown: result.aiAnalysisBreakdown,
                        overallScore: result.overallScore,
                        recommendation: recommendation,
                        summary: result.summary,
                        strengths: result.strengths,
                        weaknesses: result.weaknesses,
                        redFlags: result.redFlags,
                        criteriaMatches: result.criteriaMatches,
                        updatedAt: new Date(),
                    }
                },
                { upsert: true }
            )

            // Also update applicant's aiScore
            await Applicant.findByIdAndUpdate(applicantId, {
                $set: {
                    aiScore: result.overallScore,
                    aiRecommendation: recommendation,
                    aiSummary: typeof result.summary === 'string'
                        ? result.summary
                        : result.summary?.en || '',
                }
            })

            console.log(`  ✅ Updated with score: ${result.overallScore}%, recommendation: ${recommendation}`)
            updated++

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000))

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
