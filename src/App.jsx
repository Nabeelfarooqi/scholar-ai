import { useEffect, useRef, useState } from 'react'
import './App.css'
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import Quiz from './Quiz'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const DEMO_MODE = true

function getDemoChatResponse(input, subject) {
    const text = input.toLowerCase().trim()

    if (!text) {
        return `## Demo mode

Please enter a question to see a simulated response.`
    }

    if (text === 'hi' || text === 'hello' || text === 'hey') {
        return `## Demo mode

Hey — this public version is running in **demo mode**, so no live AI request was used.

You can try asking things like:
- "What is a derivative?"
- "Explain Newton's second law"
- "What is an atom?"
- "Give me a study tip"

In the full version, Scholar AI would respond dynamically using AI.`
    }

    if (subject === 'Calculus' || text.includes('derivative') || text.includes('integral') || text.includes('limit')) {
        return `## Demo response — Calculus

A **derivative** measures how fast a function changes.

For example, if:

$$f(x) = x^2$$

then:

$$f'(x) = 2x$$

That means the slope of the function at any point $x$ is $2x$.

### Key idea
- Function = original expression
- Derivative = rate of change / slope

This is a simulated response in demo mode.`
    }

    if (subject === 'Physics' || text.includes('force') || text.includes('motion') || text.includes('acceleration')) {
        return `## Demo response — Physics

Newton's Second Law says:

$$F = ma$$

Where:
- $F$ = force
- $m$ = mass
- $a$ = acceleration

### Example
If an object has mass $2\\,kg$ and acceleration $3\\,m/s^2$:

$$F = 2 \\cdot 3 = 6\\,N$$

This is a simulated response in demo mode.`
    }

    if (subject === 'Chemistry' || text.includes('atom') || text.includes('mole') || text.includes('reaction')) {
        return `## Demo response — Chemistry

Atoms are made of:
- **Protons** (positive)
- **Neutrons** (neutral)
- **Electrons** (negative)

### Important fact
The **atomic number** equals the number of protons.

### Example
Carbon has atomic number **6**, so it has **6 protons**.

This is a simulated response in demo mode.`
    }

    if (subject === 'Biology' || text.includes('cell') || text.includes('dna') || text.includes('photosynthesis')) {
        return `## Demo response — Biology

Cells are the basic unit of life.

### Two major cell types
- **Prokaryotic**: no nucleus
- **Eukaryotic**: has a nucleus

### Example
Plant and animal cells are eukaryotic.

This is a simulated response in demo mode.`
    }

    if (subject === 'History' || text.includes('war') || text.includes('revolution') || text.includes('independence')) {
        return `## Demo response — History

The **American Revolution** began in **1775** and the **Declaration of Independence** was signed in **1776**.

### Main cause
Many colonists opposed **taxation without representation**.

This is a simulated response in demo mode.`
    }

    return `## Demo mode

This public version is running in **demo mode**, so your message was not sent to the live backend.

### What Scholar AI would normally do
- analyze your question
- generate a subject-specific explanation
- format math clearly
- help you study step by step

### Your input
> ${input}

Try asking a more specific question for a more realistic demo response.`
}

function getDemoImageResponse(subject, fileName) {
    if (subject === 'Calculus') {
        return `## Demo image analysis — Calculus

Image received: **${fileName}**

This looks like a math assignment.

A full AI version would:
1. read the expression from the image
2. identify the question type
3. solve it step by step
4. return formatted math like:

$$f(x) = x^2$$
$$f'(x) = 2x$$

This is a simulated image response in demo mode.`
    }

    if (subject === 'Chemistry') {
        return `## Demo image analysis — Chemistry

Image received: **${fileName}**

This looks like a chemistry worksheet.

A full AI version would extract formulas, identify reaction types, and explain the answer step by step.

This is a simulated image response in demo mode.`
    }

    return `## Demo image analysis

Image received: **${fileName}**

This public version is running in demo mode, so the image was not sent to the backend.

The full version would:
- inspect the uploaded assignment image
- identify the question
- solve or explain it clearly

This is a simulated response.`
}

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

        const currentInput = input
        const newMessages = [...messages, { role: 'user', content: currentInput }]
        setMessages(newMessages)
        setInput('')

        if (DEMO_MODE) {
            setTimeout(() => {
                const demoResponse = getDemoChatResponse(currentInput, subject)
                setMessages([
                    ...newMessages,
                    {
                        role: 'assistant',
                        content: demoResponse
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

        const currentFile = imageFile
        const fileMessage = {
            role: 'user',
            content: `Uploaded image: ${currentFile.name}`
        }

        const newMessages = [...messages, fileMessage]
        setMessages(newMessages)

        if (DEMO_MODE) {
            setTimeout(() => {
                const demoResponse = getDemoImageResponse(subject, currentFile.name)
                setMessages([
                    ...newMessages,
                    {
                        role: 'assistant',
                        content: demoResponse
                    }
                ])
                setImageFile(null)
                setLoading(false)
            }, 900)
            return
        }

        try {
            const formData = new FormData()
            formData.append('image', currentFile)
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