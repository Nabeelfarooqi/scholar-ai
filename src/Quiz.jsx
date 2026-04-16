import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

function getDemoQuizQuestion(subject, topic) {
    const text = topic.toLowerCase()

    if (subject === 'Calculus' || text.includes('derivative') || text.includes('limit')) {
        return `Question: What is the derivative of $x^2$?

A) $x$
B) $2x$
C) $x^2$
D) $2$`
    }

    if (subject === 'Physics' || text.includes('force') || text.includes('motion')) {
        return `Question: According to Newton's Second Law, what is the formula for force?

A) $F = mv$
B) $F = ma$
C) $F = mg$
D) $F = m/a$`
    }

    if (subject === 'Chemistry' || text.includes('atom') || text.includes('mole')) {
        return `Question: Which particle has a negative charge?

A) Proton
B) Neutron
C) Electron
D) Nucleus`
    }

    if (subject === 'Biology' || text.includes('cell') || text.includes('dna')) {
        return `Question: Which organelle is responsible for producing ATP?

A) Nucleus
B) Mitochondria
C) Ribosome
D) Golgi apparatus`
    }

    if (subject === 'History' || text.includes('revolution') || text.includes('war')) {
        return `Question: In what year was the Declaration of Independence signed?

A) 1775
B) 1776
C) 1781
D) 1789`
    }

    return `Question: Which study method best matches active recall?

A) Re-reading notes only
B) Testing yourself from memory
C) Highlighting everything
D) Skimming textbook pages`
}

function getDemoCorrectAnswer(question) {
    if (question.includes('derivative of $x^2$')) return 'B'
    if (question.includes("Newton's Second Law")) return 'B'
    if (question.includes('negative charge')) return 'C'
    if (question.includes('producing ATP')) return 'B'
    if (question.includes('Declaration of Independence')) return 'B'
    if (question.includes('active recall')) return 'B'
    return 'B'
}

function getDemoFeedback(question, finalAnswer) {
    const correctAnswer = getDemoCorrectAnswer(question)
    const correct = finalAnswer === correctAnswer

    if (question.includes('derivative of $x^2$')) {
        return correct
            ? `CORRECT

Nice job. Using the power rule:

$$\\frac{d}{dx}(x^2) = 2x$$`
            : `INCORRECT

The correct answer is **B**.

Using the power rule:

$$\\frac{d}{dx}(x^2) = 2x$$`
    }

    if (question.includes("Newton's Second Law")) {
        return correct
            ? `CORRECT

Nice job. Newton's Second Law is:

$$F = ma$$`
            : `INCORRECT

The correct answer is **B**.

Newton's Second Law states:

$$F = ma$$`
    }

    if (question.includes('negative charge')) {
        return correct
            ? `CORRECT

Nice job. Electrons carry a **negative** charge.`
            : `INCORRECT

The correct answer is **C**.

Electrons are negatively charged, protons are positive, and neutrons are neutral.`
    }

    if (question.includes('producing ATP')) {
        return correct
            ? `CORRECT

Nice job. Mitochondria are responsible for producing ATP in the cell.`
            : `INCORRECT

The correct answer is **B**.

Mitochondria are known as the powerhouse of the cell because they produce ATP.`
    }

    if (question.includes('Declaration of Independence')) {
        return correct
            ? `CORRECT

Nice job. The Declaration of Independence was signed in **1776**.`
            : `INCORRECT

The correct answer is **B**.

The Declaration of Independence was signed in **1776**.`
    }

    return correct
        ? `CORRECT

Nice job. This was a simulated demo response.`
        : `INCORRECT

The correct answer is **${correctAnswer}**.

This was a simulated demo response.`
}

function Quiz({ subject, demoMode = false }) {
    const [studyText, setStudyText] = useState('')
    const [topic, setTopic] = useState('')
    const [difficulty, setDifficulty] = useState('Medium')
    const [fileName, setFileName] = useState('')
    const [question, setQuestion] = useState('')
    const [answer, setAnswer] = useState('')
    const [selectedChoice, setSelectedChoice] = useState('')
    const [feedback, setFeedback] = useState('')
    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(false)
    const [extracting, setExtracting] = useState(false)
    const [score, setScore] = useState(0)
    const [total, setTotal] = useState(0)
    const [history, setHistory] = useState(() => {
        const saved = localStorage.getItem('quizHistory')
        return saved ? JSON.parse(saved) : []
    })
    const [savedSets, setSavedSets] = useState(() => {
        const saved = localStorage.getItem('quizStudySets')
        return saved ? JSON.parse(saved) : []
    })
    const [setName, setSetName] = useState('')
    const [timeLeft, setTimeLeft] = useState(0)
    const [timerEnabled, setTimerEnabled] = useState(false)
    const [timeUp, setTimeUp] = useState(false)

    useEffect(() => {
        localStorage.setItem('quizHistory', JSON.stringify(history))
    }, [history])

    useEffect(() => {
        localStorage.setItem('quizStudySets', JSON.stringify(savedSets))
    }, [savedSets])

    useEffect(() => {
        if (!timerEnabled || timeLeft <= 0 || !question || feedback) return

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    setTimeUp(true)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [timerEnabled, timeLeft, question, feedback])

    const isValidMCQ =
        question.includes('A)') &&
        question.includes('B)') &&
        question.includes('C)') &&
        question.includes('D)')

    const weakTopics = useMemo(() => {
        const topicMap = {}

        history.forEach((item) => {
            const key = item.topic || 'Unknown'
            if (!topicMap[key]) {
                topicMap[key] = { wrong: 0, total: 0 }
            }
            topicMap[key].total += 1
            if (!item.correct) {
                topicMap[key].wrong += 1
            }
        })

        return Object.entries(topicMap)
            .sort((a, b) => b[1].wrong - a[1].wrong)
            .slice(0, 5)
    }, [history])

    function startTimer() {
        if (!timerEnabled) return
        setTimeLeft(60)
        setTimeUp(false)
    }

    function clearCurrentQuiz() {
        setQuestion('')
        setAnswer('')
        setSelectedChoice('')
        setFeedback('')
        setTimeUp(false)
        setTimeLeft(timerEnabled ? 60 : 0)
    }

    async function handleFileUpload(e) {
        const file = e.target.files?.[0]
        if (!file) return

        setFileName(file.name)
        clearCurrentQuiz()

        if (file.type === 'text/plain') {
            const text = await file.text()
            setStudyText(text)
            return
        }

        if (file.type === 'application/pdf') {
            setExtracting(true)

            try {
                const arrayBuffer = await file.arrayBuffer()
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

                let fullText = ''

                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum)
                    const textContent = await page.getTextContent()
                    const pageText = textContent.items.map(item => item.str).join(' ')
                    fullText += pageText + '\n\n'
                }

                setStudyText(fullText)
            } catch (error) {
                setStudyText('Could not read PDF.')
            }

            setExtracting(false)
        }
    }

    function saveStudySet() {
        if (!setName.trim() || !studyText.trim()) return

        const newSet = {
            id: Date.now(),
            name: setName,
            subject,
            topic,
            studyText,
            difficulty
        }

        setSavedSets((prev) => [newSet, ...prev])
        setSetName('')
    }

    function loadStudySet(set) {
        setStudyText(set.studyText)
        setTopic(set.topic)
        setDifficulty(set.difficulty || 'Medium')
        setFileName('')
        clearCurrentQuiz()
    }

    function deleteStudySet(id) {
        setSavedSets((prev) => prev.filter((set) => set.id !== id))
    }

    async function generateQuiz() {
        if (loading || !studyText.trim() || !topic.trim()) return
        setLoading(true)
        setQuestion('')
        setAnswer('')
        setSelectedChoice('')
        setFeedback('')
        setTimeUp(false)

        if (demoMode) {
            setTimeout(() => {
                const demoQuestion = getDemoQuizQuestion(subject, topic)
                setQuestion(demoQuestion)
                if (
                    demoQuestion.includes('A)') &&
                    demoQuestion.includes('B)') &&
                    demoQuestion.includes('C)') &&
                    demoQuestion.includes('D)')
                ) {
                    startTimer()
                }
                setLoading(false)
            }, 700)
            return
        }

        try {
            const res = await fetch(`${API_BASE}/api/quiz`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subject,
                    topic,
                    difficulty,
                    studyText
                })
            })

            const data = await res.json()
            const reply = data.text || 'No quiz generated.'
            setQuestion(reply)

            if (
                reply.includes('A)') &&
                reply.includes('B)') &&
                reply.includes('C)') &&
                reply.includes('D)')
            ) {
                startTimer()
            }
        } catch (err) {
            setQuestion('Error generating quiz.')
        }

        setLoading(false)
    }

    async function checkAnswer(choiceOverride = null) {
        const finalAnswer = (choiceOverride || selectedChoice || answer).trim().toUpperCase()

        if (!question || !finalAnswer || checking || !isValidMCQ || timeUp) return
        setChecking(true)
        setFeedback('')

        if (demoMode) {
            setTimeout(() => {
                const reply = getDemoFeedback(question, finalAnswer)
                const correct = reply.startsWith('CORRECT')

                if (correct) {
                    setScore((prev) => prev + 1)
                }

                setTotal((prev) => prev + 1)
                setFeedback(reply)
                setTimeLeft(0)

                setHistory((prev) => [
                    {
                        id: Date.now(),
                        subject,
                        topic,
                        difficulty,
                        userAnswer: finalAnswer,
                        correct,
                        question
                    },
                    ...prev
                ])

                setChecking(false)
            }, 700)
            return
        }

        try {
            const res = await fetch(`${API_BASE}/api/check-answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subject,
                    topic,
                    studyText,
                    question,
                    answer: finalAnswer
                })
            })

            const data = await res.json()
            const reply = data.text || 'No feedback generated.'
            const correct = reply.startsWith('CORRECT')

            if (correct) {
                setScore((prev) => prev + 1)
            }

            setTotal((prev) => prev + 1)
            setFeedback(reply)
            setTimeLeft(0)

            setHistory((prev) => [
                {
                    id: Date.now(),
                    subject,
                    topic,
                    difficulty,
                    userAnswer: finalAnswer,
                    correct,
                    question
                },
                ...prev
            ])
        } catch (err) {
            setFeedback('Error checking answer.')
        }

        setChecking(false)
    }

    function resetScore() {
        setScore(0)
        setTotal(0)
    }

    function clearHistory() {
        setHistory([])
        localStorage.removeItem('quizHistory')
    }

    function handleChoiceClick(choice) {
        setSelectedChoice(choice)
        setAnswer(choice)
    }

    function nextQuestion() {
        generateQuiz()
    }

    return (
        <div>
            <h2>{subject} Quiz</h2>

            {demoMode && (
                <p className="muted-text" style={{ marginBottom: '12px' }}>
                    Demo Mode Active — quiz uses simulated subject-aware questions and feedback
                </p>
            )}

            <div className="quiz-top-row">
                <p>Score: {score}/{total}</p>
                <button onClick={resetScore}>Reset Score</button>
            </div>

            <div className="quiz-actions">
                <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="difficulty-select"
                >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                </select>

                <label className="timer-toggle">
                    <input
                        type="checkbox"
                        checked={timerEnabled}
                        onChange={(e) => setTimerEnabled(e.target.checked)}
                    />
                    Timer Mode
                </label>
            </div>

            {timerEnabled && question && !feedback && isValidMCQ && (
                <p className="timer-text">Time Left: {timeLeft}s</p>
            )}

            {timeUp && !feedback && (
                <div className="warning-box">
                    Time is up. Generate the next question or try again.
                </div>
            )}

            <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileUpload}
                className="file-input"
            />

            {fileName && (
                <p className="file-name">Loaded file: {fileName}</p>
            )}

            {extracting && (
                <p className="file-name">Reading PDF...</p>
            )}

            <textarea
                value={studyText}
                onChange={(e) => setStudyText(e.target.value)}
                placeholder="Paste your notes here, or upload a PDF/TXT file above..."
                rows="8"
                className="notes-box"
            />

            <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What topic should I quiz you on?"
                className="topic-input"
            />

            <div className="save-set-row">
                <input
                    value={setName}
                    onChange={(e) => setSetName(e.target.value)}
                    placeholder="Save this study set as..."
                    className="topic-input"
                />
                <button onClick={saveStudySet}>Save Study Set</button>
            </div>

            {savedSets.length > 0 && (
                <div className="saved-sets-box">
                    <h3>Saved Study Sets</h3>
                    {savedSets.map((set) => (
                        <div key={set.id} className="saved-set-item">
                            <div>
                                <strong>{set.name}</strong>
                                <div className="muted-text">
                                    {set.subject} • {set.topic || 'No topic'} • {set.difficulty}
                                </div>
                            </div>
                            <div className="saved-set-actions">
                                <button onClick={() => loadStudySet(set)}>Load</button>
                                <button onClick={() => deleteStudySet(set.id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="quiz-actions">
                <button onClick={generateQuiz} disabled={loading || extracting}>
                    {loading ? 'Generating...' : 'Generate Question'}
                </button>
            </div>

            {loading && (
                <div>
                    <div className="skeleton" style={{ width: '90%' }}></div>
                    <div className="skeleton" style={{ width: '70%' }}></div>
                    <div className="skeleton" style={{ width: '80%' }}></div>
                </div>
            )}

            {!loading && question && (
                <div className="quiz-output">
                    <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                    >
                        {question}
                    </ReactMarkdown>

                    {!isValidMCQ && (
                        <p className="invalid-quiz-text">
                            No valid quiz could be generated. Try better notes or a clearer topic.
                        </p>
                    )}

                    {isValidMCQ && (
                        <>
                            <div className="choice-grid">
                                {['A', 'B', 'C', 'D'].map((choice) => (
                                    <button
                                        key={choice}
                                        className={`choice-button ${selectedChoice === choice ? 'selected-choice' : ''}`}
                                        onClick={() => handleChoiceClick(choice)}
                                        disabled={checking || timeUp || !!feedback}
                                    >
                                        {choice}
                                    </button>
                                ))}
                            </div>

                            <input
                                type="text"
                                value={answer}
                                onChange={(e) => {
                                    setAnswer(e.target.value)
                                    setSelectedChoice(e.target.value.trim().toUpperCase())
                                }}
                                placeholder="Enter your answer (example: A)"
                                disabled={checking || timeUp || !!feedback}
                                className="topic-input"
                            />

                            <div className="quiz-actions">
                                <button onClick={() => checkAnswer()} disabled={checking || timeUp || !!feedback}>
                                    {checking ? 'Checking...' : 'Submit Answer'}
                                </button>

                                <button onClick={nextQuestion} disabled={loading || extracting}>
                                    Next Question
                                </button>
                            </div>
                        </>
                    )}

                    {feedback && (
                        <div className="feedback-box">
                            <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                            >
                                {feedback}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            )}

            <div className="history-box">
                <div className="history-header">
                    <h3>Quiz History</h3>
                    <button onClick={clearHistory}>Clear History</button>
                </div>

                {history.length === 0 ? (
                    <p className="muted-text">No quiz history yet.</p>
                ) : (
                    history.slice(0, 8).map((item) => (
                        <div key={item.id} className="history-item">
                            <div>
                                <strong>{item.topic}</strong>
                                <div className="muted-text">
                                    {item.difficulty} • Your answer: {item.userAnswer}
                                </div>
                            </div>
                            <span className={item.correct ? 'correct-pill' : 'incorrect-pill'}>
                                {item.correct ? 'Correct' : 'Incorrect'}
                            </span>
                        </div>
                    ))
                )}
            </div>

            <div className="history-box">
                <h3>Weak Topics</h3>
                {weakTopics.length === 0 ? (
                    <p className="muted-text">No weak-topic data yet.</p>
                ) : (
                    weakTopics.map(([name, stats]) => (
                        <div key={name} className="history-item">
                            <div>
                                <strong>{name}</strong>
                            </div>
                            <span className="incorrect-pill">
                                {stats.wrong}/{stats.total} missed
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default Quiz