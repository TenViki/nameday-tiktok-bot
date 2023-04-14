import dotenv from "dotenv";
import { spawn } from "child_process";
import NameDay from "./nameday";
import { makeTTS, makeTTSAzure, splitSentences } from "./textToSpeech";
import { TimeMark, createVideo } from "./video";
import { CronJob } from "cron";

dotenv.config();

const tags = ["fyp", "foryou", "foryoupage", "dnes", "news", "dnesmasvatek"];

const titles = [
  "Super fakta o jménu {{name}}!",
  "Jméno {{name}}: Tohle jste určitě nevěděli!",
  "Zajímavosti o jménu {{name}}, o kterých jste ještě neslyšeli!",
  "Tajemsntví za jménem {{name}}: Co jste nevěděli!",
  "Jméno {{name}}: Skryté fakty a zajímavosti, které stojí za to vědět!",
  "Neuvěřitelné věci, které nevíte o jménu {{name}}!",
  "Jméno {{name}}: Překvapivé faktoidy, které vás ohromí!",
  "Jméno {{name}}: Toto by vás mohlo překvapit!",
];

const emojis = ["😱", "🤯", "🤩", "🤔", "🤨", "😳", "😧", "😨"];

const getRandomTitle = (name: string) => {
  const title = `${titles[Math.floor(Math.random() * titles.length)]} ${
    emojis[Math.floor(Math.random() * emojis.length)]
  }${emojis[Math.floor(Math.random() * emojis.length)]}`;
  return title.replace("{{name}}", name);
};

const renderVideo = async () => {
  const name = new NameDay();
  const names = await name.fetchName({
    fetchOther: true,
  });
  const nameData = names![0];
  const title = `Dnes má svátek ${nameData.name}`;
  const before = `. V České Republice toto jméno má asi ${nameData.amount} lidí. Je to ${nameData.popularityRank}. nejpoužívanější jméno. Průměrný věk je ${nameData.averageAge} let. Má ${nameData.origin} původ a význam "${nameData.meaning}". Jméno je nejpoužívanější v oblasti ${nameData.area}. `;
  const textData = await name.getWikipediaText(names![0].name);

  const fileName = new Date().toISOString().replace(/:/g, "-");

  const ttsResponse = await makeTTSAzure(
    title + '<break time="1500ms" />' + before + textData,
    fileName
  );

  ttsResponse.timeMarks[0].timeSeconds += 1.5;
  await createVideo(
    splitSentences(title + before + textData),
    ttsResponse.timeMarks as TimeMark[],
    "data/" + fileName + ".mp3",
    names?.slice(1).map((n) => n.name) || [],
    fileName
  );

  console.log("Done");

  console.log("Uploading to TikTok...");
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
  });
};

const main = async () => {
  console.log("Registering cron job...");

  try {
    new CronJob("0 7 * * *", renderVideo, null, true);

    console.log("Cron job registered");
  } catch (err) {
    console.log("Something went wrong: ", err);
  }
};

main();

//
//
//
//
//
//
//
//
//

//
//
//

//
//
//
