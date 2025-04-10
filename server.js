// server.js
import express from "express";
import fetch from "node-fetch";
import { Client } from "@gradio/client";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

// Supabase config
const supabase = createClient('https://trblhcytzzdsvatxjbds.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmxoY3l0enpkc3ZhdHhqYmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5MzQ3NjIsImV4cCI6MjA1OTUxMDc2Mn0.o6ysuFzh0GsW5rMvoRCt6LGN61gsjJszuKPxNtflumw');

app.post("/pix2pix", async (req, res) => {
  try {
    const { imageUrl, prompt } = req.body;
    if (!imageUrl || !prompt) return res.status(400).json({ error: "Missing fields" });

    const response = await fetch(imageUrl);
    if (!response.ok) return res.status(400).json({ error: "Failed to fetch image" });

    const imageBlob = await response.blob();

    const client = await Client.connect("AyrinAnwar/InstructPix2PixAyrin");
    const result = await client.predict("/transform", {
      image: imageBlob,
      prompt,
      steps: 1,
    });

    const outputBlob = result.data[0].image;
    const buffer = await outputBlob.arrayBuffer();
    const fileName = `pix2pix-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("images") // 🔁 change
      .upload(fileName, buffer, { contentType: "image/png" });

    if (uploadError) return res.status(500).json({ error: "Upload failed" });

    const { data: publicUrlData } = supabase.storage.from("images").getPublicUrl(fileName);

    return res.status(200).json({ imageUrl: publicUrlData.publicUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
