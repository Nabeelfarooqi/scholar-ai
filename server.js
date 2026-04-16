import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://scholar-ai-xi.vercel.app'

// CORS: only allow your frontend
app.use(cors({
    origin: [FRONTEND_URL]
}))

app.use(express.json({ limit: '10mb' }))

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
})

// Model choices
const CHAT_MODEL = 'claude-sonnet-4-6'
const QUIZ_MODEL = 'claude-haiku-4-5-20251001'

// Limits
const usageByIp = new Map()
const FREE_DAILY_LIMIT = 40
let totalRequests = 0
const MAX_TOTAL_REQUESTS = 1000

function getClientIp(req) {
    return (
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        'unknown'
    )
}

function resetUsageIfNeeded(record) {
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000

    if (!record || now - record.startedAt > oneDay) {
        return { count: 0, startedAt: now }
    }

    return record
}

function usageLimitMiddleware(req, res, next) {
    if (totalRequests >= MAX_TOTAL_REQUESTS) {
        return res.status(503).json({
            error: 'Service temporarily unavailable. Please try again later.'
        })
    }

    const ip = getClientIp(req)
    const record = resetUsageIfNeeded(usageByIp.get(ip))

    if (record.count >= FREE_DAILY_LIMIT) {
        return res.status(429).json({
            error: `Free limit reached. You’ve used ${FREE_DAILY_LIMIT} AI requests today.`
        })
    }

    record.count += 1
    usageByIp.set(ip, record)
    totalRequests += 1

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} | IP: ${ip} | Daily Count: ${record.count} | Total Requests: ${totalRequests}`)

    next()
}

// Root route
app.get('/', (req, res) => {
    res.send('Scholar AI backend is running.')
})

// Health check
app.get('/api/health', (req, res) => {
    res.json({ ok: true })
})

// Chat endpoint
app.post('/api/chat', usageLimitMiddleware, async (req, res) => {
    try {
        const { messages, subject } = req.body

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages are required.' })
        }

        const response = await anthropic.messages.create({
            model: CHAT_MODEL,
            max_tokens: 700,
            system: `You are a study assistant specializing in ${subject}.

Rules:
- Always explain clearly and step-by-step
- ALWAYS format math using LaTeX
- Use $...$ for inline math
- Use $$...$$ for equations
- Never output raw math symbols without formatting
- Use markdown headings and bullet points when helpful
- Keep explanations clean and readable

Examples:
Instead of: f'(x) = 2x
Write: $$f'(x) = 2x$$

Instead of: 1/2
Write: $$\\frac{1}{2}$$

When solving problems:
- Show steps clearly
- Put important equations on separate lines
- Keep the final answer easy to spot`,
            messages
        })

        res.json({
            text: response.content?.[0]?.text || 'No response.'
        })
    } catch (error) {
        console.error('Chat error:', error)
        res.status(500).json({ error: 'Failed to get chat response.' })
    }
})

// Quiz generation endpoint
app.post('/api/quiz', usageLimitMiddleware, async (req, res) => {
    try {
        const { subject, topic, difficulty, studyText } = req.body

        if (!studyText?.trim() || !topic?.trim()) {
            return res.status(400).json({ error: 'Study text and topic are required.' })
        }

        if (studyText.length > 20000) {
            return res.status(400).json({
                error: 'Study material is too large. Please shorten it or split it into smaller sections.'
            })
        }

        const response = await anthropic.messages.create({
            model: QUIZ_MODEL,
            max_tokens: 400,
            system: `You are a ${subject} teacher. Only use the study material the user provides. Difficulty should be ${difficulty}. If the material is not sufficient, clearly say that no valid quiz can be generated.

Otherwise, generate EXACTLY one multiple choice question in this format only:

Question: ...
A) ...
B) ...
C) ...
D) ...

Do not include the answer.`,
            messages: [
                {
                    role: 'user',
                    content: `Study material:\n${studyText}\n\nTopic: ${topic}\n\nCreate one ${difficulty.toLowerCase()} multiple choice question based only on this material.`
                }
            ]
        })

        res.json({
            text: response.content?.[0]?.text || 'No quiz generated.'
        })
    } catch (error) {
        console.error('Quiz error:', error)
        res.status(500).json({ error: 'Failed to generate quiz.' })
    }
})

// Answer checking endpoint
app.post('/api/check-answer', usageLimitMiddleware, async (req, res) => {
    try {
        const { subject, topic, studyText, question, answer } = req.body

        if (!question?.trim() || !answer?.trim()) {
            return res.status(400).json({ error: 'Question and answer are required.' })
        }

        if (studyText && studyText.length > 20000) {
            return res.status(400).json({
                error: 'Study material is too large. Please shorten it or split it into smaller sections.'
            })
        }

        const response = await anthropic.messages.create({
            model: QUIZ_MODEL,
            max_tokens: 350,
            system: `You are a ${subject} teacher. Only use the study material and quiz question provided.

Rules:
- First line must be exactly CORRECT or INCORRECT
- Then explain the correct answer briefly and clearly
- If math is used, format it with LaTeX using $...$ or $$...$$`,
            messages: [
                {
                    role: 'user',
                    content: `Study material:\n${studyText}\n\nTopic: ${topic}\n\nQuestion:\n${question}\n\nMy answer: ${answer}`
                }
            ]
        })

        res.json({
            text: response.content?.[0]?.text || 'No feedback generated.'
        })
    } catch (error) {
        console.error('Check answer error:', error)
        res.status(500).json({ error: 'Failed to check answer.' })
    }
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})