import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, context, messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompts: Record<string, string> = {
      "profile-insights": `You are a career coach AI for Gigvora, a professional networking platform. Analyze the user's profile and provide 3-5 actionable insights to improve their profile visibility, attract more clients, and stand out. Be specific, concise, and encouraging. Format as bullet points.`,
      "writing-assist": `You are a professional writing assistant for Gigvora. Help the user craft polished, engaging content for their posts, proposals, gig descriptions, or messages. Keep the tone professional but warm. Be concise.`,
      "smart-match": `You are an AI matching engine for Gigvora. Given a job/project description and a candidate profile, output a match score (0-100) and 3 reasons why they match or don't. Be objective and data-driven.`,
      "message-draft": `You are an AI assistant helping draft professional messages on Gigvora. Write clear, friendly, professional messages. Keep them concise (2-4 sentences for most). Adapt tone based on context (hiring, proposal, networking, follow-up).`,
      "content-moderate": `You are a content moderation AI for Gigvora. Analyze the provided content and determine if it violates community guidelines. Return a JSON object with: { "safe": boolean, "reason": string, "confidence": number (0-1), "category": string }. Categories: spam, harassment, fraud, inappropriate, misinformation, safe.`,
      "gig-pricing": `You are an AI pricing advisor for Gigvora. Based on the gig category, skills required, delivery timeline, and market data, suggest optimal pricing for Basic, Standard, and Premium tiers. Explain your reasoning briefly.`,
      "candidate-rank": `You are a talent ranking AI for Gigvora's Recruiter Pro. Given a list of candidates and job requirements, rank them by fit. For each candidate provide: rank, match score (0-100), key strengths, and potential concerns. Be objective.`,
      "job-enrichment": `You are a job description AI for Gigvora. Enhance the provided job description with better formatting, missing requirements, suggested skills, and salary range estimates. Keep the original intent but make it more appealing and complete.`,
      "prospect-score": `You are a sales intelligence AI for Gigvora's Sales Navigator. Given a prospect's profile and the user's offering, score the prospect (0-100) for likelihood of conversion. Provide 3 key signals and a suggested outreach approach.`,
      "thread-summary": `You are a conversation AI for Gigvora. Summarize the message thread in 2-3 sentences, highlighting key decisions, action items, and any pending questions. Be concise and factual.`,
      chat: `You are Gigvora AI, a helpful professional assistant on the Gigvora platform. You help users with career advice, proposal writing, job searching, gig management, project planning, networking, and general platform guidance. Be friendly, professional, and concise.`,
    };

    const systemPrompt = systemPrompts[type] || systemPrompts.chat;

    let userMessages: Array<{ role: string; content: string }> = [];
    if (messages && Array.isArray(messages)) {
      userMessages = messages;
    } else if (context) {
      userMessages = [{ role: "user", content: JSON.stringify(context) }];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...userMessages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
