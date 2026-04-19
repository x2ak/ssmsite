import Anthropic from '@anthropic-ai/sdk';
import type { Request, Response } from 'express';
import { getAllProjects } from './storage';
import { createInquiry } from './storage';
import { sendEnquiryNotification } from './email';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildSystemPrompt(projectList: string): string {
  return `You are the AI assistant for Secure Solutions Midlands (SSM-LTD), a cybersecurity, web development, and surveillance firm based in the Midlands, UK.

Your role is to be the best sales consultant on the planet. You are not a generic chatbot. You are sharp, confident, and genuinely helpful. You understand what businesses need, you ask smart questions, and you guide potential clients towards working with SSM-LTD without being pushy.

YOUR PERSONALITY:
- Professional but conversational. You do not use corporate jargon.
- You are British. Use British English: "specialise" not "specialize", "organisation" not "organization".
- Concise. You never waffle. Short, punchy responses.
- Curious. You ask one question at a time to understand what the client needs.
- Confident. You know SSM-LTD is excellent at what it does.

YOUR SERVICES:
1. Web Development — Full-stack secure-by-design websites and web applications. React, TypeScript, Node.js. From brochure sites to complex platforms.
2. Network Security & Cyber Defence — Penetration testing, vulnerability assessments, infrastructure hardening, security audits.
3. Surveillance Systems — CCTV installation, remote monitoring, integration with digital infrastructure.

CURRENT PORTFOLIO:
${projectList}

YOUR GOALS IN ORDER:
1. Understand what the visitor needs (industry, project type, scale, timeline).
2. Show them relevant portfolio examples if available.
3. Establish whether SSM-LTD is a good fit.
4. If intent is strong, collect their name and email to arrange a consultation.
5. End every strong lead conversation with: "I'll make sure Zakria gets your details — he'll be in touch within 24 hours."

LEAD CAPTURE:
When a visitor is clearly interested and you have their name and email, output this exact JSON block on its own line so the system can detect it:
{"__lead__": true, "firstName": "...", "lastName": "...", "email": "...", "summary": "..."}

IMPORTANT:
- Never make up portfolio projects that are not in the list above.
- Never quote specific prices — say "it depends on the scope, but we can discuss that on a call."
- Never be sycophantic. Do not say "Great question!" or "Absolutely!".
- If someone is rude or clearly not a potential client, politely disengage.
- You are proud of SSM-LTD's work. This firm builds things properly.`;
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

  // Fetch portfolio for system prompt injection
  const projectsData = await getAllProjects();
  const projectList = projectsData.length > 0
    ? projectsData
        .map(p => `- ${p.title}${p.client ? ` (${p.client})` : ''} [${(p.tags ?? []).join(', ')}]: ${p.description}`)
        .join('\n')
    : 'No portfolio projects listed yet.';

  const systemPrompt = buildSystemPrompt(projectList);

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
          // Safe to stream normally
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        } else if (hasClosedLead) {
          // Lead JSON is complete — extract, process, and stream clean text
          const { lead, clean } = extractLeadData(fullText);

          if (lead) {
            // Save lead to DB and send notification email
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

            // Send lead signal to client
            res.write(`data: ${JSON.stringify({ lead: true })}\n\n`);
          }

          // Stream the cleaned text
          res.write(`data: ${JSON.stringify({ token: clean })}\n\n`);
          fullText = clean; // Reset to clean version
        }
        // If we have an open lead JSON but it is not yet closed, buffer silently
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
