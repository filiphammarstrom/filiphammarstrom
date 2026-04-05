import Anthropic from 'npm:@anthropic-ai/sdk@0.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are a task parser for a Swedish todo app.
Parse natural language input into structured task data.

Always respond with valid JSON in this format:
{
  "message": "A short friendly confirmation in Swedish",
  "tasks": [
    {
      "title": "Task title",
      "dueDate": "YYYY-MM-DD or null",
      "priority": 1 | 2 | 3 | 4,
      "projectName": "Project name or null",
      "notes": "Optional notes or null",
      "tags": ["tag1", "tag2"],
      "subtasks": ["subtask1", "subtask2"]
    }
  ]
}

Priority scale: 1=Urgent/red, 2=High/orange, 3=Medium/yellow, 4=Low/grey.
If the user mentions "P1","brådskande","urgent" → priority 1.
If "P2","hög","viktig","high" → priority 2.
If "P3","medium" → priority 3.
Otherwise → priority 4.

For dates:
- "idag" → today's date
- "imorgon" → tomorrow's date
- "nästa måndag" → next monday
- Relative dates should be resolved to ISO format YYYY-MM-DD

Extract subtasks if the user mentions a list or sequence (e.g. "design, kod, test").
Multiple tasks can be created if input describes several distinct items.`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { text, userId } = await req.json()

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing text' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const anthropic = new Anthropic({ apiKey })

    const today = new Date().toISOString().slice(0, 10)
    const userMessage = `Today's date is ${today}.\n\nUser input: "${text}"`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Claude did not return valid JSON')
    }

    const parsed = JSON.parse(jsonMatch[0])

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('claude-task error:', err)
    return new Response(
      JSON.stringify({ error: 'Kunde inte tolka uppgiften', details: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
