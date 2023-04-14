// Imports the Google Cloud client library
import * as tts from "@google-cloud/text-to-speech/build/src/v1beta1";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

// Import other required libraries

import fs from "fs";
import util from "util";

import { writeFile } from "fs/promises";
import { TimeMark } from "./video";

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

  return `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="cs-CZ">
  <voice name="cs-CZ-AntoninNeural">
  <mstts:silence  type="Sentenceboundary" value="0ms"/>
  <mstts:silence  type="Tailing" value="0ms"/>
  <mstts:silence  type="Tailing-exact" value="0ms"/>
  <mstts:silence  type="Leading " value="0ms"/>
  <mstts:silence  type="Leading-exact" value="0ms"/>
  ${sentences.map((s, i) => s + `<bookmark mark="mark-${i}" />`)}
  </voice>
  </speak>`;
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

const synthesizerPromise = (synth: sdk.SpeechSynthesizer, ssml: string) =>
  new Promise<sdk.SpeechSynthesisResult>((resolve, reject) => {
    synth.speakSsmlAsync(ssml, (cb) => {
      resolve(cb);
    });
  });

export const makeTTSAzure = async (text: string, fileName: string) => {
  const audioConfig = sdk.AudioConfig.fromAudioFileOutput(
    "data/" + fileName + ".mp3"
  );
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_KEY!,
    process.env.AZURE_REGION!
  );

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  const timeMarks: TimeMark[] = [];

  synthesizer.bookmarkReached = (sender, args) => {
    timeMarks.push({
      name: args.text,
      timeSeconds: args.audioOffset / 10000000,
    });
  };

  const ssml = convertTextToSSML(text);

  const result = await synthesizerPromise(synthesizer, ssml);

  console.log(result);

  await writeFile(
    "data/" + fileName + ".mp3",
    new Uint8Array(result.audioData),
    "binary"
  );

  return { result, timeMarks };
};
