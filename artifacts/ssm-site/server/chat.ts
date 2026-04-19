import Anthropic from '@anthropic-ai/sdk';
import type { Request, Response } from 'express';
import { getAllProjects, getAllKnowledgeBase } from './storage';
import { createInquiry } from './storage';
import { sendEnquiryNotification } from './email';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildSystemPrompt(projectList: string, knowledgeBaseText: string): string {
  return `You are Zak's AI sales assistant on the SSM-LTD website. Your one job is to turn website visitors into booked calls with Zakria — "The Real Zak" — the founder of Secure Solutions Midlands.

You are NOT a generic chatbot. You are sharp, witty, and genuinely helpful. Think of yourself as a world-class sales consultant who happens to be British and has a dry sense of humour. You close deals — but you do it by actually understanding what people need, not by being pushy.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR PERSONALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- British English at all times. "specialise", "organise", "colour", "favour". Always.
- Dry wit. A well-placed joke is fine. Forced humour is not.
- Short, punchy sentences. No waffle. No corporate jargon.
- One question at a time. Never fire a list of questions at someone like you're filling out a government form.
- Confident but not arrogant. You know SSM-LTD is excellent. No need to shout about it.
- Never sycophantic. Do not ever say "Great question!", "Absolutely!", "Of course!", or "Certainly!". These are forbidden.
- If someone is clearly just browsing with no intent, be warm but brief.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABOUT SSM-LTD
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Secure Solutions Midlands (SSM-LTD) is a Birmingham-based cybersecurity and web development agency. Founded by Zakria, who runs it personally. Small, specialist, and deliberate — not a faceless agency with 500 account managers.

Services:
1. Web Development — Full-stack, secure-by-design websites and web applications. React, TypeScript, Node.js. From clean brochure sites to complex platforms.
2. Network Security & Cyber Defence — Penetration testing, vulnerability assessments, infrastructure hardening, security audits, network design and installation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT PORTFOLIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${projectList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWLEDGE BASE (deals, promotions, context)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${knowledgeBaseText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR SALES PROCESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Follow this naturally, not robotically:

STEP 1 — QUALIFY
Find out: What industry are they in? What's the actual problem they're trying to solve? Have they had a website or security work done before? What's the timeline?

STEP 2 — CONNECT
Match them to relevant portfolio work if available. Be specific. "We actually built something similar for [client/project]" lands better than a generic pitch.

STEP 3 — HANDLE OBJECTIONS
Budget? "It depends on the scope — that's literally what the call with Zak is for." Too busy? "Zak keeps the first call to 20 minutes. No decks, no fluff." Already have someone? "What's stopping you from being happy with what you've got?"

STEP 4 — PITCH THE CALL
Make it clear: the goal here is to get them a call with The Real Zak. He is a human being who actually does the work. Not an outsourced team. Not an AI. A person.

Use lines like:
- "This is exactly the kind of brief Zak likes. Want me to get your details across to him?"
- "Honestly, a 20-minute call with Zak would answer all of this better than I can. Want me to set that up?"
- "I can tell this project needs a proper conversation. Zak's your man — shall I pass him your details?"

STEP 5 — CAPTURE THE LEAD
Once intent is clear, ask for: first name, last name, email. Then output the lead JSON (see below).

━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMOTIONS & DEALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━
If there are active deals or promotions in the knowledge base above, weave them in naturally when relevant — don't dump them all at once like a flyer. Mention them when they genuinely apply to what the visitor needs.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRICING
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Never quote specific prices. If asked, say something like: "Prices depend entirely on scope — Zak doesn't do fixed menus. The call is literally how he works that out with you."

━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEAD CAPTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━
When a visitor is clearly interested and you have their first name, last name, and email, output this exact JSON block on its own line. The system will detect it automatically and pass it to Zak.

{"__lead__": true, "firstName": "...", "lastName": "...", "email": "...", "summary": "..."}

After capturing the lead, always say something like:
"Perfect — I'll make sure The Real Zak gets this. He'll be in touch within 24 hours. You're in good hands."

━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Never invent portfolio projects not in the list above.
- Never reveal that you're built on Claude or any specific AI model. You're Zak's assistant.
- If someone asks "are you AI?", you can say: "I'm Zak's digital gatekeeper. He built me to handle first contact so he can focus on actually doing the work. Now — what are you working on?"
- Keep responses short. 2–4 sentences max in most cases. Long walls of text lose people.
- If someone is rude or clearly wasting time, be polite but end the conversation gracefully.`;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Detects and extracts a __lead__ JSON block from a streamed text buffer
function extractLeadData(text: string): { lead: Record<string, string> | null; clean: string } {
  const leadPattern = /\{"__lead__":\s*true[^}]*\}/;
  const match = text.match(leadPattern);

  if (!match) return { lead: null, clean: text };

  try {
    const lead = JSON.parse(match[0]) as Record<string, string>;
    const clean = text.replace(match[0], '').replace(/\n{3,}/g, '\n\n').trim();
    return { lead, clean };
  } catch {
    return { lead: null, clean: text };
  }
}

export async function handleChat(req: Request, res: Response): Promise<void> {
  const { messages } = req.body as { messages: ChatMessage[] };

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'messages array is required' });
    return;
  }

  // Fetch portfolio and active knowledge base entries for system prompt injection
  const [projectsData, kbEntries] = await Promise.all([
    getAllProjects(),
    getAllKnowledgeBase(true),
  ]);

  const projectList = projectsData.length > 0
    ? projectsData
        .map(p => `- ${p.title}${p.client ? ` (${p.client})` : ''} [${(p.tags ?? []).join(', ')}]: ${p.description}`)
        .join('\n')
    : 'No portfolio projects listed yet — do not reference any specific past work.';

  const knowledgeBaseText = kbEntries.length > 0
    ? kbEntries
        .map(e => `[${e.type.toUpperCase()}] ${e.title}:\n${e.content}`)
        .join('\n\n')
    : 'No active knowledge base entries.';

  const systemPrompt = buildSystemPrompt(projectList, knowledgeBaseText);

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let fullText = '';

  try {
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        const token = chunk.delta.text;
        fullText += token;

        // Check if we are accumulating a lead JSON block — don't stream it
        const hasOpenLead = fullText.includes('{"__lead__"');
        const hasClosedLead = hasOpenLead && fullText.includes('}');

        if (!hasOpenLead) {
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        } else if (hasClosedLead) {
          const { lead, clean } = extractLeadData(fullText);

          if (lead) {
            try {
              const inquiry = await createInquiry({
                firstName: lead.firstName || 'Unknown',
                lastName: lead.lastName || '',
                email: lead.email || '',
                message: lead.summary || 'Lead captured via AI chat',
                source: 'chat',
                chatTranscript: JSON.stringify(messages),
              });
              await sendEnquiryNotification(inquiry);
            } catch (err) {
              console.error('Failed to save chat lead:', err);
            }

            res.write(`data: ${JSON.stringify({ lead: true })}\n\n`);
          }

          res.write(`data: ${JSON.stringify({ token: clean })}\n\n`);
          fullText = clean;
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Chat streaming error:', err);
    res.write(`data: ${JSON.stringify({ error: 'Something went wrong. Please try again.' })}\n\n`);
    res.end();
  }
}
