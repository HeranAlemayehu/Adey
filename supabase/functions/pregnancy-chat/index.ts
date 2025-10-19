import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a helpful pregnancy assistant specializing in fetal movement and pregnancy health. 

Here are the answers to common questions:

Q: Is it safe to exercise while pregnant?
A: Yes, most pregnant women can safely exercise, such as walking, swimming, or prenatal yoga. Avoid activities with high risk of falling or abdominal trauma. Always consult your doctor before starting a new routine.

Q: How do I count my baby's kicks?
A: Pick a consistent time each day, usually when your baby is most active. Sit or lie down, place your hands on your belly, and count each movement until you reach 10.

Q: How many times should my baby move each day?
A: After 28 weeks, most babies move at least 10 times within 2 hours during active periods. Movements vary daily, so focus on overall patterns rather than exact counts.

Q: What does it mean if my baby is moving less than usual?
A: A noticeable decrease in movement may indicate that your baby needs medical attention. Contact your healthcare provider promptly for advice.

Q: When should I start tracking fetal movements?
A: Most women start noticing fetal movements between 18–25 weeks. You can start regular tracking around 28 weeks for more consistent monitoring.

Q: What positions are best for feeling my baby move?
A: Sitting or lying on your left side is usually best. This position increases blood flow and makes it easier to feel movements.

Q: Can my baby's movements change throughout the day?
A: Yes. Babies often have periods of activity and rest. Movements may be stronger in the evening or after meals.

Q: What should I do if I notice a sudden decrease in movements?
A: Lie down, relax, and try to gently stimulate your baby by drinking something cold or sweet. If movements remain low, contact your healthcare provider immediately.

Q: How can I tell the difference between normal movements and worrying signs?
A: Normal patterns include consistent movements, with active and quiet periods. Worrying signs include a significant reduction or absence of movement compared to your usual pattern.

Q: Can fetal movement tracking help detect problems early?
A: Yes. Consistent monitoring helps you notice changes in your baby's activity, which can prompt timely medical attention if something is wrong.

Use this knowledge to answer questions. Be supportive, informative, and always remind users to consult their healthcare provider for medical concerns.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
