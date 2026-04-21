import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type FormEvent,
} from 'react';
import { useLocation } from 'wouter';
import ReactMarkdown from 'react-markdown';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const INTRO =
  "Hey — I'm Zak's assistant. He's out doing the actual work, so I'm here to figure out what you need. What are you working on?";

class ChatErrorBoundary extends Error {}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: '' }]);
  const [isInitialTyping, setIsInitialTyping] = useState(true);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  // Type in the intro message character by character on mount
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setMessages([{ role: 'assistant', content: INTRO.slice(0, i) }]);
      if (i >= INTRO.length) {
        clearInterval(interval);
        setIsInitialTyping(false);
      }
    }, 26);
    return () => clearInterval(interval);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Re-focus input once streaming finishes so the keyboard never disappears
  useEffect(() => {
    if (!isStreaming && !isInitialTyping) {
      // Small delay so mobile browsers register the re-focus after the DOM settles
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [isStreaming, isInitialTyping]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isStreaming || isInitialTyping) return;

    if (text.toLowerCase() === 'admin') {
      navigate('/x7-control');
      return;
    }

    setInput('');
    setError(null);
    // Keep focus so keyboard never closes on mobile
    inputRef.current?.focus();

    const userMessage: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Placeholder for assistant response
    const assistantMessage: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMessage]);
    setIsStreaming(true);

    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          leadAlreadyCaptured: leadCaptured,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new ChatErrorBoundary('Chat request failed');
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data) as {
              token?: string;
              replace?: string;
              lead?: boolean;
              error?: string;
            };

            if (parsed.error) {
              setError(parsed.error);
              setIsStreaming(false);
              return;
            }

            if (parsed.lead) {
              setLeadCaptured(true);
            }

            if (parsed.replace !== undefined) {
              // Server sent a corrected full text — replace the last assistant message
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: parsed.replace! };
                }
                return updated;
              });
            } else if (parsed.token !== undefined) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + parsed.token,
                  };
                }
                return updated;
              });
            }
          } catch {
            // Malformed SSE chunk — ignore
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      console.error('Chat error:', err);
      setError(
        "I'm having a moment — you can reach us directly at contact@ssmltd.co.uk."
      );
      // Remove empty assistant message
      setMessages(prev => {
        const updated = [...prev];
        if (updated[updated.length - 1]?.content === '') {
          updated.pop();
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
      // Safety net: if the stream ended with an empty assistant bubble
      // (e.g. silent server error), remove it and surface a message.
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && !last.content.trim()) {
          setError("Didn't get a response — you can also reach us at contact@ssmltd.co.uk.");
          return prev.slice(0, -1);
        }
        return prev;
      });
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage();
  }

  return (
    <div className="w-full flex flex-col h-full">
      {/* Message list — grows to fill available space, scrollable */}
      <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto px-1 py-2 mb-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-[var(--radius)] px-4 py-3 text-sm',
                msg.role === 'user'
                  ? 'bg-primary/10 border-l-2 border-primary text-foreground ml-8'
                  : 'bg-card border border-border text-foreground mr-8'
              )}
            >
              {msg.role === 'assistant' ? (() => {
                const isTypingThis = (isStreaming || isInitialTyping) && i === messages.length - 1;
                return (
                  <div className="prose prose-sm max-w-none">
                    {isTypingThis ? (
                      <p style={{ margin: 0 }}>
                        {msg.content}<span className="cursor-blink" aria-hidden="true" />
                      </p>
                    ) : (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    )}
                  </div>
                );
              })() : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Lead capture success */}
        {leadCaptured && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] bg-primary/10 border border-primary/30 text-primary text-sm font-medium">
              <CheckCircle size={14} />
              Details received. Zakria will be in touch.
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              <AlertCircle size={14} />
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isInitialTyping ? '' : isStreaming ? 'Zak\'s assistant is typing…' : 'Type your message…'}
          rows={1}
          readOnly={isStreaming || isInitialTyping}
          className={cn(
            'w-full resize-none rounded-[var(--radius)] border border-border bg-card',
            'px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
            'transition-colors duration-150',
            (isStreaming || isInitialTyping) && 'opacity-60 cursor-default',
            'min-h-[48px] max-h-[160px]'
          )}
          style={{ height: 'auto', overflow: 'hidden' }}
          onInput={e => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 160) + 'px';
          }}
          aria-label="Chat message input"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming || isInitialTyping}
          onMouseDown={e => e.preventDefault()}
          className={cn(
            'absolute right-3 bottom-3 h-7 w-7 flex items-center justify-center',
            'rounded-[var(--radius)] bg-primary text-primary-foreground',
            'hover:opacity-90 transition-opacity cursor-pointer',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
          aria-label="Send message"
        >
          <Send size={13} />
        </button>
      </form>

      {/* Desktop: keyboard shortcut hint. Mobile: "send directly" fallback link */}
      <p className="mt-2 text-center text-xs text-muted-foreground hidden sm:block">
        Press <kbd className="font-mono">Enter</kbd> to send · <kbd className="font-mono">Shift+Enter</kbd> for new line
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground sm:hidden">
        Or{' '}
        <a href="/contact" className="text-primary hover:underline">send us a message directly</a>
        {' '}— we respond within 24 hours.
      </p>
    </div>
  );
}
