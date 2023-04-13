// Imports the Google Cloud client library
import * as tts from "@google-cloud/text-to-speech/build/src/v1beta1";

// Import other required libraries

import fs from "fs";
import util from "util";

export const splitSentences = (text: string) => {
  const regex = /(?<![0-9])[.,!?]\s*|(?:\s+a\s+)+/g;
  const matches = text.match(regex);
  const sentences = text.split(regex);

  console.log(matches, sentences);

  return sentences
    .map((sentence, index) => (sentence + (matches?.[index] || "")).trim())
    .filter((sentence) => sentence.trim() !== "");
};

const convertTextToSSML = (text: string) => {
  // after each sentence add a <mark>

  const sentences = splitSentences(text);

  return `<speak>${sentences.map(
    (s, i) => s + `<mark name="mark-${i}" />`
  )}</speak>`;
};

// Creates a client
const client = new tts.TextToSpeechClient({
  keyFilename: "./keys/google.json",
});
export async function makeTTS(text: string) {
  // The text to synthesize
  // Construct the reques

  const ssml = convertTextToSSML(text);
  // Performs the text-to-speech request
  const [response, asd] = await client.synthesizeSpeech({
    input: { ssml },
    voice: { languageCode: "cs-CZ", ssmlGender: "NEUTRAL" },
    audioConfig: { audioEncoding: "MP3", pitch: -11.5, speakingRate: 1.16 },
    enableTimePointing: ["SSML_MARK"] as unknown as number[],
  });

  // Write the binary audio content to a local file
  const writeFile = util.promisify(fs.writeFile);

  console.log(response);

  await writeFile("output.mp3", response.audioContent!, "binary");
  console.log("Audio content written to file: output.mp3");

  return response;
}
