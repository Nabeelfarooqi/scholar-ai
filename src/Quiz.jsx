import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

function Quiz({ subject }) {
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

        try {
            const res = await fetch('http://localhost:3001/api/quiz', {
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
        const finalAnswer = (choiceOverride || selectedChoice || answer).trim()

        if (!question || !finalAnswer || checking || !isValidMCQ || timeUp) return
        setChecking(true)
        setFeedback('')

        try {
            const res = await fetch('http://localhost:3001/api/check-answer', {
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