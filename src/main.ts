import dotenv from "dotenv";
import { spawn } from "child_process";
import NameDay from "./nameday";
import { makeTTS, makeTTSAzure, splitSentences } from "./textToSpeech";
import { TimeMark, createVideo } from "./video";

dotenv.config();

const main = async () => {
  // const name = new NameDay();
  // const names = await name.fetchName({
  //   fetchOther: true,
  // });
  // const nameData = names![0];
  // const title = `Dnes má svátek ${nameData.name}`;
  // const before = `. V České Republice toto jméno má asi ${nameData.amount} lidí. Je to ${nameData.popularityRank}. nejpoužívanější jméno. Průměrný věk je ${nameData.averageAge} let. Má ${nameData.origin} původ a význam "${nameData.meaning}". Jméno je nejpoužívanější v oblasti ${nameData.area}. `;
  // const textData = await name.getWikipediaText(names![0].name);
  // const ttsResponse = await makeTTSAzure(
  //   title + '<break time="1500ms" />' + before + textData
  // );
  // ttsResponse.timeMarks[0].timeSeconds += 1.5;
  // createVideo(
  //   splitSentences(title + before + textData),
  //   ttsResponse.timeMarks as TimeMark[],
  //   "output.mp3",
  //   names?.slice(1).map((n) => n.name) || []
  // );
};

main();

const child = spawn(process.env.PYTHON_COMMAND!, [
  "python/tiktokUploader.py",
  "-i",
  process.env.TIKTOK_SSID!,
  "-p",
  "output.mp4",
  "-t",
  "A tiktok video",
]);

child.stdout.on("data", (data) => {
  console.log(`stdout: ${data}`);
});

child.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});
