import { useEffect, useRef, useState } from 'react'
import './App.css'
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import Quiz from './Quiz'

function App() {
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('messages')
        return saved ? JSON.parse(saved) : []
    })
    const [subject, setSubject] = useState('Calculus')
    const [tab, setTab] = useState('chat')
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

        try {
            const res = await fetch('http://localhost:3001/api/chat', {
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
            const reply = data.text || 'No response.'

            setMessages([...newMessages, { role: 'assistant', content: reply }])
        } catch (error) {
            setMessages([
                ...newMessages,
                { role: 'assistant', content: 'Something went wrong.' }
            ])
        }

        setLoading(false)
    }

    return (
        <div>
            <h1>Study Assistant</h1>

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
                    <Quiz subject={subject} />
                </div>
            )}
        </div>
    )
}

export default App