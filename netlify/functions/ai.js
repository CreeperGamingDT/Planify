export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing GROQ_API_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }


  const body = await req.json();
  //console.log(body)


  const prompt = `You are a productivity planner. The user has the following objective:

  "${body.objective}"

  ${body.contextNotes ? 'User\'s notes and context:\n' + body.contextNotes : ''}

  Timeframe: ${body.startDate} to ${body.endDate} (${body.finishDays} days)
  Available time per day: ${body.hours}h ${body.minutes}min (${body.totalMinutes} minutes)

  Create a practical, actionable daily schedule. Break the objective into specific tasks distributed logically across the days. Each day can have 1-4 tasks. Tasks should be concrete and completable within the day's time budget.

  Respond ONLY with valid JSON (no markdown, no explanation) in this exact format:
  {
    "title": "Short schedule title",
    "tasks": [
      { "date": "YYYY-MM-DD", "task": "Task description", "duration": 30, "notes":"" }
    ]
  }

  Rules:
  - Only include dates from ${body.startDate} to ${body.endDate}
  - duration is in minutes, should be the smallest time period that this task can be completed in
  - Total duration per task should not exceed ${body.totalMinutes} minutes
  - Tasks should build progressively toward the objective
  - Be specific and actionable 
  - Include only the notes that are necessary to complete the task, pulling from the provided notes/context (e.g., textbook definitions or historical events). If no relevant notes are provided, leave the notes field blank. 
      Example: Task = "Install required transformers library\",
      Notes = "I have Python and a code editor installed",
      Response = "User has Python pre-installed and a ready IDE."`;

  
   const TaskDetailsprompt = `You are an expert productivity planner. The user has the following objective:

  "${body.objective}"
  
  Create a step-by-step guide for the task below.

  Task: "${body.task}"
  Estimated duration: ${body.duration}
  Notes/context: ${body.notes || 'None'}

  Already completed tasks:
  ${body.previousTasks}

  Provide as many, actionable steps. Keep them practical and specific. Provide numbered lists for each step with the markdown example below (markdown example is not needed to be included with response)
  
  
  ### Step 1: Install Python
  1. **Download the latest version of Python**: Go to the official Python website (<link>https://www.python.org/downloads/</link>) and download the latest version for your operating system.
  2. **Run the installer**: Once the download is complete, run the installer and follow the prompts.
  
  Rules:
  - Respond using only the allowed markdown format; do not use any other markdown.
  - Wrap every URL in <link>FULL_URL</link>. The link text must be the full URL (not a word or phrase).
  - Wrap every code example or text in \`\` if neccesary.
  `;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2000,
      messages: [{
        role:"user",
        content:body.for==="Calender"?prompt:TaskDetailsprompt
      }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    return new Response(
      JSON.stringify({ error: 'Groq request failed', status: response.status, details: errText }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content || '';

  //console.log(raw)
  return new Response(JSON.stringify({ content: raw }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config = { path: '/api/planifyai/chat' };
