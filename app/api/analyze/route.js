import { NextResponse } from "next/server";

const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/complete";
const MODEL = "claude-3.5-mini";

const promptTemplate = ({ month, categories }) => `Du bist Claude, ein deutscher Spar-Coach für persönliche Finanzen. Analysiere die folgenden Kategorien mit ihrem Monatsbudget und den tatsächlichen Ausgaben für ${month}. Gib ausschließlich gültiges JSON zurück in folgendem Format:

{"tipps": [{"kategorie": "...", "einsparpotenzial": "...", "empfehlung": "..."}, {"kategorie": "...", "einsparpotenzial": "...", "empfehlung": "..."}, {"kategorie": "...", "einsparpotenzial": "...", "empfehlung": "..."}]}

Nutze nur deutsche Texte. Erstelle drei konkrete, personalisierte Spartipps. Verwende keine Erklärungen außerhalb des JSONs.

Daten:
${JSON.stringify(categories, null, 2)}
`;

export async function POST(request) {
  try {
    const body = await request.json();
    const { month, categories } = body;

    if (!month || !Array.isArray(categories)) {
      return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Anthropic API-Schlüssel fehlt" }, { status: 500 });
    }

    const prompt = promptTemplate({ month, categories });

    const response = await fetch(ANTHROPIC_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        max_tokens_to_sample: 400,
        temperature: 0.3,
        top_p: 1,
        stop_sequences: ["\n\n"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Anthropic API-Fehler", details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    const completion = result.completion || result.response || "";

    let parsed;
    try {
      parsed = JSON.parse(completion.trim());
    } catch (error) {
      const jsonStart = completion.indexOf("{\"tipps\"");
      const jsonText = jsonStart >= 0 ? completion.slice(jsonStart) : completion;
      parsed = JSON.parse(jsonText.trim());
    }

    if (!parsed || !Array.isArray(parsed.tipps)) {
      return NextResponse.json(
        { error: "Ungültige Antwort von Claude", details: completion },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: "Serverfehler", details: error.message }, { status: 500 });
  }
}
