export default async (req, context) => {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const body = await req.json();

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Netlify.env.get('GROQ_API_KEY')}` // ← key name change
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',  // ← model change
            max_tokens: 2000,
            messages: body.messages            // ← same messages array, no change needed
        })
    });

    const data = await response.json();

    const raw = data.choices[0].message.content; // ← Groq/OpenAI format

    return new Response(JSON.stringify(raw), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};

export const config = { path: '/api/chat' };