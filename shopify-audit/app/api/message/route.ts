import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient } from '@/lib/anthropic';
import type { MessageRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: MessageRequest = await request.json();
    const { primaryFinding, prospectLinkedIn, storeUrl } = body;

    if (!primaryFinding || !storeUrl) {
      return NextResponse.json(
        { error: 'Missing primaryFinding or storeUrl' },
        { status: 400 }
      );
    }

    const anthropic = getAnthropicClient();

    const systemPrompt = `You are Ravi, founder of Shap Infotech (Shopify development agency).
You're writing personalized cold outreach for Shopify store owners and founders.

Follow the founder-to-founder template:
1. Genuine insight about the founder or brand (based on prospect context)
2. One customer-centric observation (from the audit finding)
3. Relevant credibility (a specific result you've achieved)
4. Low-pressure CTA (offer to share a Loom or discovery call)

Writing rules:
- Be authentic. Sound like a real person, not a bot.
- LinkedIn DM: 60–80 words, 3 short paragraphs, no bullets
- Email: 160–180 words, subject line references the observation (not company name), no formal sign-off
- Use natural language and avoid AI patterns:
  FORBIDDEN: "I noticed", "It stood out", "Upon exploring", "I analysed", "leverage", "optimize", "synergy", "I wanted to reach out", "I came across"
  PREFERRED: "I ended up spending", "I found myself clicking", "One thing I kept thinking about", "Maybe it's intentional but...", "I saw something"
- The observation should feel naturally discovered, not like the purpose of the outreach
- Include a specific result (e.g., "Helped a D2C brand reduce cart abandonment by 28%")
- Never ask for a meeting directly — suggest something low-pressure first`;

    const userMessage = `
Store URL: ${storeUrl}
Store finding: "${primaryFinding.finding}"
Business impact: "${primaryFinding.impact}"

Prospect context: ${prospectLinkedIn || 'No prospect context provided'}

Generate TWO versions:

1. LINKEDIN DM (60–80 words, 3 paragraphs, no subject line):
[Write the message here]

2. EMAIL:
Subject: [Short line referencing the observation, not the company name]
Body: [160–180 words]

Format your response as:
LINKEDIN DM:
[message]

EMAIL SUBJECT:
[subject]

EMAIL BODY:
[body]`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    const linkedinMatch = responseText.match(
      /LINKEDIN DM:\n([\s\S]*?)(?=EMAIL SUBJECT:|$)/
    );
    const emailSubjectMatch = responseText.match(
      /EMAIL SUBJECT:\n(.*?)(?=\n|$)/
    );
    const emailBodyMatch = responseText.match(/EMAIL BODY:\n([\s\S]*?)$/);

    const linkedin = linkedinMatch?.[1]?.trim() || '';
    const emailSubject = emailSubjectMatch?.[1]?.trim() || '';
    const emailBody = emailBodyMatch?.[1]?.trim() || '';

    return NextResponse.json({
      linkedin: {
        content: linkedin,
        wordCount: linkedin.split(/\s+/).filter(Boolean).length,
      },
      email: {
        subject: emailSubject,
        body: emailBody,
        wordCount: emailBody.split(/\s+/).filter(Boolean).length,
      },
      full: responseText,
    });
  } catch (error) {
    console.error('Message generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate message' },
      { status: 500 }
    );
  }
}
