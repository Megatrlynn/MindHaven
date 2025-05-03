// const API_URL = "https://openrouter.ai/api/v1/chat/completions";
// const OPENROUTER_API_KEY = "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"; // Replace with your actual API key

// async function testOpenRouter() {
//   try {
//     const response = await fetch(API_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
//       },
//       body: JSON.stringify({
//         model: "deepseek/deepseek-r1-distill-llama-70b:free",
//         messages: [{ role: "user", content: "Hello! How are you?" }],
//       }),
//     });

//     if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

//     const data = await response.json();
//     console.log("AI Response:", data.choices[0].message.content);
//   } catch (error) {
//     console.error("Test failed:", error);
//   }
// }

// testOpenRouter();

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = "RB-26";

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

