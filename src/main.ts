import dotenv from "dotenv";
import { spawn } from "child_process";
import NameDay from "./nameday";
import { makeTTS, makeTTSAzure, splitSentences } from "./textToSpeech";
import { TimeMark, createVideo } from "./video";
import { CronJob } from "cron";

import { google } from "googleapis";
import { readFile } from "fs/promises";
import { createReadStream } from "fs";
import { sys } from "typescript";

const OAuth2 = google.auth.OAuth2;

dotenv.config();

const auth = new OAuth2({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
});

const tags = ["fyp", "foryou", "foryoupage", "dnes", "news", "dnesmasvatek"];

const titles = [
  "Super fakta o jménu {{name}}!",
  "{{name}}: Tohle jste určitě nevěděli!",
  "Zajímavosti o jménu {{name}}, o kterých jste ještě neslyšeli!",
  "Tajemství za jménem {{name}}: Co jste nevěděli!",
  "{{name}}: Skryté fakty a zajímavosti, které stojí za to vědět!",
  "Neuvěřitelné věci, které nevíte o jménu {{name}}!",
  "{{name}}: Překvapivé fakty, které vás ohromí!",
  "{{name}}: Toto by vás mohlo překvapit!",
];

const emojis = ["😱", "🤯", "🤩", "🤔", "🤨", "😳", "😧", "😨"];

const getRandomTitle = (name: string) => {
  const title = `${titles[Math.floor(Math.random() * titles.length)]}`;
  return title.replace("{{name}}", name);
};

const renderVideo = async () => {
  const name = new NameDay();
  const names = await name.fetchName({
    fetchOther: true,
  });
  const nameData = names![0];
  const title = `Dnes má svátek ${nameData.name}. `;
  const before = `V České Republice toto jméno má asi ${nameData.amount} lidí. Je to ${nameData.popularityRank}. nejpoužívanější jméno. Průměrný věk je ${nameData.averageAge} let. Má ${nameData.origin} původ a význam "${nameData.meaning}". Jméno je nejpoužívanější v oblasti ${nameData.area}. `;
  const textData = (await name.getWikipediaText(names![0].name)).replaceAll(
    /<!--((?!batcache)(?!\[endif\])[\s\S])*?-->/g,
    ""
  );

  const after =
    "Pokud znáte někoho, kdo má toto jméno, nezapomeňte jej označit v komentářích.";

  const fileName = new Date().toISOString().replace(/:/g, "-");

  const ttsResponse = await makeTTSAzure(
    title +
      '<break time="750ms" />' +
      before +
      textData +
      '<break time="750ms" />' +
      after,
    fileName
  );

  ttsResponse.timeMarks[0].timeSeconds += 1.5;
  await createVideo(
    splitSentences(title + before + textData + " " + after),
    ttsResponse.timeMarks as TimeMark[],
    "data/" + fileName + ".mp3",
    names?.slice(1).map((n) => n.name) || [],
    fileName,
    nameData.day
  );

  console.log("Done");

  if (process.argv.includes("--no-upload")) return;

  // upload video to youtube
  console.log("Uploading to YouTube...");

  const oAuthData = await readFile("keys/oauth.json", "utf-8");

  auth.setCredentials(JSON.parse(oAuthData));

  const youtube = google.youtube({
    version: "v3",
    auth: auth,
  });

  let uploadedToYoutube = "";
  let uploadedToTikTok = "true";

  try {
    await youtube.videos.insert(
      {
        // onBehalfOfContentOwnerChannel: process.env.YOUTUBE_CHANNEL_ID,
        // onBehalfOfContentOwner: process.env.YOUTUBE_OWNER_ID,

        part: ["snippet", "status"],
        notifySubscribers: true,
        requestBody: {
          snippet: {
            title: getRandomTitle(nameData.name),
            description: before + textData,
            tags: ["#shorts", "#svatek", "#news"],
            defaultLanguage: "cs",
          },
          status: {
            privacyStatus: "public",
            selfDeclaredMadeForKids: false,
            embeddable: true,
          },
        },
        media: {
          body: createReadStream("data/" + fileName + ".mp4"),
        },
      },
      {
        retry: false,
      }
    );

    uploadedToYoutube = "true";
  } catch (error: any) {
    console.error(error);
    uploadedToYoutube = error.message;
  }

  console.log("Uploading to TikTok...");

  try {
  } catch (error) {}
  const child = spawn(process.env.PYTHON_COMMAND!, [
    "python/tiktokUploader.py",
    "-i",
    process.env.TIKTOK_SSID!,
    "-p",
    "data/" + fileName + ".mp4",
    "-t",
    getRandomTitle(nameData.name),
    "--tags",
    ...tags,
  ]);
  child.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });
  child.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
    uploadedToTikTok = "false";
  });

  child.on("close", (code) => {
    console.log("-- upload status --");
    console.log("Youtube:", uploadedToYoutube);
    console.log("TikTok:", uploadedToTikTok);
  });
};

const main = async () => {
  console.log("Registering cron job...");

  // if argument --now is passed, render video immediately
  if (process.argv[2] === "--now") {
    await renderVideo();
    return;
  }

  try {
    new CronJob("0 6 * * *", renderVideo, null, true);

    console.log("Cron job registered");
  } catch (err) {
    console.log("Something went wrong: ", err);
  }
};

main();
