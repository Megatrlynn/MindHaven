import { getJson } from "serpapi";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const SEARCH_API_KEY = import.meta.env.VITE_SERPAPI_KEY;

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const AI_MODEL = "deepseek/deepseek-r1-distill-llama-70b:free";

// Function to fetch AI response from OpenRouter
async function fetchAIResponse(messages: any) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({ model: AI_MODEL, messages }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`AI API Error: ${errorData.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response from AI.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Error: Unable to fetch AI response.";
  }
}

// Function to perform a Google search using SerpAPI
export async function searchInternet(query: string) {
  try {
    const response = await getJson({
      engine: "google",
      q: query,
      api_key: SEARCH_API_KEY,
      num: 3, // Limit to top 3 results
    });

    return (response.organic_results || []).map((result: any) => ({
      title: result.title,
      snippet: result.snippet,
      link: result.link,
    }));
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

// Main function to process user queries
export async function getAIResponse(prompt: string) {
  try {
    const analysisMessages = [
      {
        role: 'system',
        content: `You are a therapy-focused AI assistant. Your task is to:
1. Analyze if the user's question requires external information
2. Determine if it's a therapy/mental health related question
3. Decide if you can answer directly or need to search for more information

Respond with JSON only in this format:
{
  "needsSearch": boolean,
  "searchQuery": string or null,
  "isTherapyRelated": boolean
}`
      },
      { role: 'user', content: prompt }
    ];

    const analysisResponse = await fetchAIResponse(analysisMessages);

    if (!analysisResponse) {
      throw new Error("AI did not return a valid response.");
    }

    // 🔥 Extract only the JSON part (from '{' to '}')
    const jsonMatch = analysisResponse.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("Unexpected AI response format:", analysisResponse);
      throw new Error("AI response was not in the expected format.");
    }

    let analysis;
    try {
      analysis = JSON.parse(jsonMatch[0]); // ✅ Only parse the extracted JSON
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Response:", jsonMatch[0]);
      throw new Error("AI response was not in the expected format.");
    }

    let searchResults = [];

    if (analysis.needsSearch) {
      searchResults = await searchInternet(analysis.searchQuery || prompt);
    }

    const finalMessages = [
      {
        role: 'system',
        content: `You are a supportive AI therapy assistant. Your task is to provide helpful, relevant responses with these guidelines:

1. For therapy-related questions:
   - Show empathy and validate feelings
   - Provide specific coping strategies
   - Use a warm, supportive tone
   - Suggest professional help when appropriate

2. For general questions:
   - Provide clear, accurate information
   - Keep the tone supportive
   - Make complex topics understandable
   - Include relevant examples when helpful

3. When using search results:
   - Synthesize the information clearly
   - Focus on the most relevant points
   - Explain in simple terms
   - Credit sources when appropriate

Remember to always be direct and relevant to the specific question asked.`
      },
      {
        role: 'user',
        content: `User question: ${prompt}${
          searchResults.length > 0
            ? '\n\nRelevant search results:\n' +
              searchResults
                .map(
                  (result: any) =>
                    `- ${result.title}\n  ${result.snippet}`
                )
                .join('\n')
            : ''
        }`
      }
    ];

    return await fetchAIResponse(finalMessages);
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("AI analysis failed.");
  }
}
