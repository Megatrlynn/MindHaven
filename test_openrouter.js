const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = "NVIDIA-GEFORCE-RTX-TITAN-SUPER-XT-001";

async function testOpenRouter() {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
    },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-distill-llama-70b:free",
        messages: [{ role: "user", content: "Hello!" }]
      })
    });

    const data = await response.json();
    console.log("Full Response:", data);

    if (data.error) {
      console.error("API Error:", data.error);
    } else {
      console.log("AI Response:", data.choices[0].message.content);
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testOpenRouter();
