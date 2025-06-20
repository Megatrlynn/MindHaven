import { getJson } from "serpapi";
import { supabase } from "./supabase";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const SEARCH_API_KEY = import.meta.env.VITE_SERPAPI_KEY;

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const AI_MODEL = "mistralai/mistral-small-3.1-24b-instruct:free";

// 🧠 Fetch chat memory
async function fetchChatSummaries(userId: string) {
  const { data, error } = await supabase
    .from("chat_history")
    .select("summary")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Fetch memory error:", error);
    return [];
  }

  return data.map((item: any) => ({
    role: "system",
    content: `Memory: ${item.summary}`,
  }));
}

// 🧠 Save a summary
async function saveChatSummary(userId: string, summary: string) {
  const { error } = await supabase.from("chat_history").insert([
    { user_id: userId, summary },
  ]);
  if (error) console.error("Save summary error:", error);
}

// 💬 Summarize conversation
async function summarizeChat(prompt: string, answer: string) {
  const summaryMessages = [
    {
      role: "system",
      content: "Summarize the following conversation briefly:",
    },
    { role: "user", content: `Q: ${prompt}\nA: ${answer}` },
  ];

  const response = await fetchAIResponse(summaryMessages);
  return response.slice(0, 500); // Keep summaries short
}

async function getQuestionCount(userId: string) {
  const { count, error } = await supabase
    .from("ai_chats")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Question count error:", error);
    return 0;
  }

  return count || 0;
}

async function suggestDoctor(userId: string) {
  const { data: connections, error: connectionError } = await supabase
    .from("doctor_patient_connections")
    .select("doctor_id, status")
    .eq("patient_id", userId);

  if (connectionError) {
    console.error("Connection fetch error:", connectionError);
    return null;
  }

  const connectedDoctorIds = connections
    .filter((conn) => conn.status === "connected")
    .map((conn) => conn.doctor_id);

  const { data: doctors, error: docError } = await supabase
    .from("doctors")
    .select("id, name, profession");

  if (docError) {
    console.error("Doctor fetch error:", docError);
    return null;
  }

  // Pick a doctor based on profession keywords from memory
  const memory = await fetchChatSummaries(userId);
  const memoryText = memory.map((m) => m.content).join(" ").toLowerCase();

  const suitableDoctor = doctors.find((doc) =>
    memoryText.includes(doc.profession.toLowerCase())
  );

  const isConnected = suitableDoctor && connectedDoctorIds.includes(suitableDoctor.id);

  return suitableDoctor
    ? {
        name: suitableDoctor.name,
        profession: suitableDoctor.profession,
        isConnected,
      }
    : null;
}

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
      throw new Error(
        `AI API Error: ${errorData.error?.message || "Unknown error"}`
      );
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
      num: 3,
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
export async function getAIResponse(prompt: string, userId: string) {
  if (!userId) throw new Error("Missing userId! Cannot proceed.");
  console.log("🆔 Using userId:", userId);

  try {
    const memoryMessages = await fetchChatSummaries(userId);

    const analysisMessages = [
      {
        role: "system",
        content: `You are a therapy-focused AI assistant. Your task is to:
1. Analyze if the user's question requires external information.
2. Determine if it's a therapy/mental health-related question.
3. Decide if you can answer directly or need to search for more information.
4. Identify if a book or video recommendation would be helpful for the user.

Respond with JSON only in this format:
{
  "needsSearch": boolean,
  "searchQuery": string or null,
  "isTherapyRelated": boolean,
  "recommendBookOrVideo": boolean,
  "recommendationTopic": string or null
}`
      },
      ...memoryMessages,
      { role: "user", content: prompt }
    ];

    const analysisResponse = await fetchAIResponse(analysisMessages);
    console.log("🤖 AI Raw Output:", analysisResponse);

    let analysis;
    try {
      const jsonMatch = analysisResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON object found in AI response.");
      analysis = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("🛑 Failed to parse AI analysis JSON:", analysisResponse);
      throw new Error("AI response format is invalid.");
    }

    // 🌐 Search & 📚 Book/Video Rec
    let searchResults = [];
    let bookOrVideoResults = [];

    if (analysis.needsSearch) {
      searchResults = await searchInternet(analysis.searchQuery || prompt);
    }

    if (analysis.recommendBookOrVideo && analysis.recommendationTopic) {
      const rawResults = await searchInternet(
        `Best books or videos on ${analysis.recommendationTopic}`
      );
    
      if (rawResults && rawResults.length > 0) {
        const filtered = rawResults.filter((result: any) => {
          const isNotAmazon = !result.link.includes("amazon");
          const isValidVideoLink = result.link.includes("youtube.com")
            ? isValidYouTubeLink(result.link)
            : true;
          return isNotAmazon && isValidVideoLink;
        });
    
        // Set fallback safely
        bookOrVideoResults =
          filtered.length > 0 ? filtered : [rawResults[0]].filter(Boolean);
      } else {
        bookOrVideoResults = []; // No results at all
      }
    }    

    // 📊 Question counter logic (now safe!)
    let questionCount = 1;
    let isEligible = false;

    const { data: counterData } = await supabase
      .from("ai_question_counter")
      .select("question_count")
      .eq("user_id", userId)
      .single();

    if (counterData) {
      questionCount = typeof counterData.question_count === "number" ? counterData.question_count : 1;
      
      const updatedCount = questionCount + 1;

      isEligible = updatedCount >= 3 && analysis.isTherapyRelated;

      await supabase
        .from("ai_question_counter")
        .update({
          question_count: isEligible ? 1 : updatedCount,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);

      await supabase
        .from("ai_question_counter")
        .update({
          question_count: updatedCount,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);
    } else {
      await supabase
        .from("ai_question_counter")
        .insert([{ user_id: userId, question_count: 1 }]);
    }

    // 🧠 Doctor suggestion if 3 therapy-related questions reached
    let doctorSuggestion = "";

    if (isEligible) {
      const suggestion = await suggestDoctor(userId);

      if (suggestion) {
        if (suggestion.isConnected) {
          doctorSuggestion = `👩‍⚕️ You're already connected to Dr. ${suggestion.name} (${suggestion.profession}). Consider reaching out for personalized help.`;
        } else {
          doctorSuggestion = `🕓 You've requested to connect with Dr. ${suggestion.name} (${suggestion.profession}), but it’s still pending. Please wait for confirmation.`;
        }
      } else {
        const fallbackDocs = await supabase
          .from("doctors")
          .select("name, profession")
          .ilike("profession", `%${analysis.recommendationTopic || "therapy"}%`)
          .limit(1);

        if (fallbackDocs.data && fallbackDocs.data.length > 0) {
          const doc = fallbackDocs.data[0];
          doctorSuggestion = `💡 You're not connected to any doctor yet. Based on your queries, Dr. ${doc.name} (${doc.profession}) might be a good fit.`;
        }
      }

      // ⏱️ Reset the counter after suggesting
      await supabase
        .from("ai_question_counter")
        .update({ question_count: 1, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }

    const finalMessages = [
      {
        role: "system",
        content: `You are a supportive therapy-focused AI assistant. 
      Always give concise, meaningful, and easy-to-understand responses. 
      Avoid long explanations unless necessary. 
      Keep replies short (2–5 sentences max), direct, and helpful.
      Only give general advice unless the user asks for country- or culture-specific details.`
      },
      ...memoryMessages,
      {
        role: "user",
        content: `User question: ${prompt}${
          searchResults.length > 0
            ? "\n\nRelevant search results:\n" +
              searchResults
                .map(
                  (r: any) =>
                    `- ${r.title}\n  ${r.snippet}\n  Link: ${r.link}`
                )
                .join("\n")
            : ""
        }${
          bookOrVideoResults.length > 0
            ? "\n\nRecommended books or videos:\n" +
              bookOrVideoResults
                .map(
                  (r: any) =>
                    `- ${r.title}\n  ${r.snippet}\n  Link: ${r.link}`
                )
                .join("\n")
            : ""
        }${doctorSuggestion ? "\n\n" + doctorSuggestion : ""}`
      }
    ];

    const aiResponse = await fetchAIResponse(finalMessages);
    const summary = await summarizeChat(prompt, aiResponse);
    await saveChatSummary(userId, summary);

    console.log("💬 Final AI Response:", aiResponse);
    console.log("🧑‍⚕️ Doctor Suggestion:", doctorSuggestion);

    return (
      aiResponse +
      (bookOrVideoResults.length > 0
        ? `\n\n📚 Recommended books or videos for you:\n` +
          bookOrVideoResults
            .map(
              (r: any) =>
                `- ${r.title}\n  ${r.snippet}\n  👉 ${r.link}`
            )
            .join("\n")
        : "") +
      (doctorSuggestion
        ? `\n\n🧑‍⚕️ Based on your recent questions:\n${doctorSuggestion}`
        : "")
    );    
    
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("AI processing failed.");
  }
}

// Function to validate YouTube links (to check if the video exists)
async function isValidYouTubeLink(link: string) {
  try {
    const videoId = link.split("v=")[1]?.split("&")[0];
    if (!videoId) return false;

    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    return response.ok;
  } catch (error) {
    console.error("YouTube link validation error:", error);
    return false;
  }
}
