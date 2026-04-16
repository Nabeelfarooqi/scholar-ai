import { useEffect, useRef, useState } from 'react'
import './App.css'
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import Quiz from './Quiz'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const DEMO_MODE = true

function App() {
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('messages')
        return saved ? JSON.parse(saved) : []
    })
    const [subject, setSubject] = useState('Calculus')
    const [tab, setTab] = useState('chat')
    const [imageFile, setImageFile] = useState(null)
    const bottomRef = useRef(null)

    useEffect(() => {
        localStorage.setItem('messages', JSON.stringify(messages))
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    function handleClear() {
        setMessages([])
        localStorage.removeItem('messages')
    }

    async function handleAsk() {
        if (!input.trim() || loading) return
        setLoading(true)

        const newMessages = [...messages, { role: 'user', content: input }]
        setMessages(newMessages)
        setInput('')

        if (DEMO_MODE) {
            setTimeout(() => {
                setMessages([
                    ...newMessages,
                    {
                        role: 'assistant',
                        content: `## Demo mode

This public version is running in **demo mode**, so no live AI request was used.

Example explanation:

A derivative tells you how fast a function is changing.

If:

$$f(x) = x^2$$

then:

$$f'(x) = 2x$$

Turn off demo mode in the private version to use real AI responses.`
                    }
                ])
                setLoading(false)
            }, 700)
            return
        }

        try {
            const res = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: newMessages,
                    subject
                })
            })

            const data = await res.json()
            const reply = data.text || data.error || 'No response.'

            setMessages([...newMessages, { role: 'assistant', content: reply }])
        } catch (error) {
            setMessages([
                ...newMessages,
                { role: 'assistant', content: 'Something went wrong.' }
            ])
        }

        setLoading(false)
    }

    async function handleImageAsk() {
        if (!imageFile || loading) return
        setLoading(true)

        const fileMessage = {
            role: 'user',
            content: `Uploaded image: ${imageFile.name}`
        }

        const newMessages = [...messages, fileMessage]
        setMessages(newMessages)

        if (DEMO_MODE) {
            setTimeout(() => {
                setMessages([
                    ...newMessages,
                    {
                        role: 'assistant',
                        content: `## Demo image analysis

This public version is in **demo mode**, so the image was not sent to the backend.

Example response:

This looks like an assignment problem. A real version of Scholar AI would:
1. Read the image
2. Identify the question
3. Solve it step by step
4. Return a clean answer with formatting

Turn off demo mode in the private version to use real image analysis.`
                    }
                ])
                setImageFile(null)
                setLoading(false)
            }, 900)
            return
        }

        try {
            const formData = new FormData()
            formData.append('image', imageFile)
            formData.append('subject', subject)
            formData.append('prompt', 'Solve or explain the assignment shown in this image.')

            const res = await fetch(`${API_BASE}/api/image-chat`, {
                method: 'POST',
                body: formData
            })

            const data = await res.json()

            if (!res.ok) {
                setMessages([
                    ...newMessages,
                    { role: 'assistant', content: data.error || 'Image upload failed.' }
                ])
                setLoading(false)
                return
            }

            const reply = data.text || 'No response.'

            setMessages([...newMessages, { role: 'assistant', content: reply }])
            setImageFile(null)
        } catch (error) {
            setMessages([
                ...newMessages,
                { role: 'assistant', content: `Request failed: ${error.message}` }
            ])
        }

        setLoading(false)
    }

    return (
        <div>
            <h1>Study Assistant</h1>


            {DEMO_MODE && (
                <p className="muted-text" style={{ textAlign: 'center', marginBottom: '16px' }}>
                    Demo Mode Active — live AI requests are disabled in this public version
                </p>
            )}

            <div className="tab-bar">
                <button onClick={() => setTab('chat')}>Chat</button>
                <button onClick={() => setTab('quiz')}>Quiz</button>
            </div>

            <div className="subject-bar">
                <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                    <option>Calculus</option>
                    <option>Chemistry</option>
                    <option>Physics</option>
                    <option>Biology</option>
                    <option>History</option>
                </select>

                {tab === 'chat' && (
                    <button onClick={handleClear}>Clear Chat</button>
                )}
            </div>

            {tab === 'chat' && (
                <>
                    <div className="chat-box">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message ${msg.role === 'user' ? 'user' : 'assistant'}`}
                            >
                                <strong>{msg.role === 'user' ? 'You' : 'Assistant'}:</strong>
                                <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        ))}

                        {loading && (
                            <div>
                                <div className="skeleton" style={{ width: '90%' }}></div>
                                <div className="skeleton" style={{ width: '70%' }}></div>
                                <div className="skeleton" style={{ width: '80%' }}></div>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    <div className="input-bar">
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        />
                        <button onClick={handleImageAsk} disabled={loading || !imageFile}>
                            {loading ? 'Analyzing...' : imageFile ? 'Ask from Image' : 'Select an Image First'}
                        </button>
                    </div>

                    <div className="input-bar">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                            placeholder="Ask a question..."
                            disabled={loading}
                        />
                        <button onClick={handleAsk} disabled={loading}>
                            {loading ? 'Thinking...' : 'Ask'}
                        </button>
                    </div>
                </>
            )}

            {tab === 'quiz' && (
                <div className="quiz-box">
                    <Quiz subject={subject} demoMode={DEMO_MODE} />
                </div>
            )}
        </div>
    )
}

export default App