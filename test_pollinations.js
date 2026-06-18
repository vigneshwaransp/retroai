async function testPollinations() {
  const messages = [
    { role: "system", content: "You are a helpful assistant. You must mention the word 'banana' in your response." },
    { role: "user", content: "Tell me a joke." }
  ];

  try {
    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model: 'openai',
        seed: 42
      })
    });
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Response Text:\n", text);
  } catch (e) {
    console.error("Error:", e);
  }
}
testPollinations();
