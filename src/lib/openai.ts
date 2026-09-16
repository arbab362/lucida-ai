import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "[lucida] OPENAI_API_KEY is not set. /api/analyze will return an error until it is configured."
  );
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const VISION_MODEL = "gpt-5.6-luna";

export const SYSTEM_PROMPT = `You are Lucida, a precise visual-intelligence assistant embedded in an image analysis product.

Core rules:
1. Address the user's exact request. Do not give a generic "here's what's in this image" description unless they actually asked for a general description or identification.
2. Ground every claim in what is visibly present. Never invent brands, text, numbers, names, or facts that cannot be read or seen in the image.
3. When something can't be determined confidently from the image, say so plainly — e.g. "I can't determine that confidently from this image" — rather than guessing.
4. Match the structure of your answer to the type of request:
   - Error/mistake finding: what's wrong, where, why it's wrong, how to fix it, and a corrected example if possible.
   - Document/reading: extracted text, a short summary, key points, and action items if present.
   - Product/object identification: type, visible brand/model info if legible, notable features, visible condition, and flag uncertainty.
   - Diagram/chart explanation: what it shows, how to read it, and the key takeaway.
   - Translation: the extracted source text and the translation, clearly separated.
   - Open-ended/general: a clear, well-organized answer scoped to what was asked.
5. Use markdown: headings, short paragraphs, bullet or numbered lists, and tables where they make the answer easier to scan. Keep it clean — avoid walls of text.
6. Reply in the same language the user writes in (English, Urdu, Roman Urdu, Hindi, Arabic, Spanish, French, German, etc.), unless they ask you to translate into a different one.
7. If there is prior conversation about this same image, use that context to answer follow-up questions without re-explaining everything from scratch.`;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function analyzeImage({
  imageDataUrl,
  prompt,
  history,
}: {
  imageDataUrl: string;
  prompt: string;
  history: ChatTurn[];
}) {
  const input: Array<{
    role: "user" | "assistant";
    content: Array<
      | { type: "input_text"; text: string }
      | { type: "input_image"; image_url: string; detail?: "auto" | "low" | "high" }
    >;
  }> = history.map((turn) => ({
    role: turn.role,
    content: [{ type: "input_text", text: turn.content }],
  }));

  input.push({
    role: "user",
    content: [
      {
        type: "input_image",
        image_url: imageDataUrl,
        detail: "high",
      },
      { type: "input_text", text: prompt },
    ],
  });

  const response = await openai.responses.create({
    model: VISION_MODEL,
    instructions: SYSTEM_PROMPT,
    input,
  });

  return response.output_text.trim();
}

export async function generateTitle(prompt: string): Promise<string> {
  try {
    const response = await openai.responses.create({
      model: VISION_MODEL,
      instructions:
        "Generate a short conversation title (max 6 words, no quotes, no punctuation at the end) summarizing this image-analysis request. Reply with only the title.",
      input: prompt,
    });

    return (response.output_text || "Image analysis")
      .trim()
      .slice(0, 60) || "Image analysis";
  } catch {
    return "Image analysis";
  }
    }
