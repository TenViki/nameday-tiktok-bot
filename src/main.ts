import dotenv from "dotenv";
import { spawn } from "child_process";
import NameDay from "./nameday";
import { makeTTS, splitSentences } from "./textToSpeech";
import { TimeMark, createVideo } from "./video";

dotenv.config();

const main = async () => {
  const name = new NameDay();
  const names = await name.fetchName({
    fetchOther: true,
  });

  const nameData = names![0];

  const before = `Dnes má svátek ${nameData.name}. V České Republice toto jméno má asi ${nameData.amount} lidí. Je to ${nameData.popularityRank}. nejpoužívanější jméno. Průměrný věk je ${nameData.averageAge} let. Má ${nameData.origin} původ a význam "${nameData.meaning}". Jméno je nejpoužívanější v oblasti ${nameData.area}. `;

  const textData = await name.getWikipediaText(names![0].name);

  const ttsResponse = await makeTTS(before + textData);

  // createVideo(
  //   splitSentences(before + textData),
  //   ttsResponse.timepoints as TimeMark[],
  //   "output.mp3"
  // );
};

main();

// upload video to tiktok
// const child = spawn(process.env.PYTHON_COMMAND!, [
//   "python/tiktokUploader.py",
//   "-i",
//   process.env.TIKTOK_SSID!,
//   "-p",
//   "tmp/video.mp4",
//   "-t",
//   "A tiktok video",
// ]);

// child.stdout.on("data", (data) => {
//   console.log(`stdout: ${data}`);
// });

// child.stderr.on("data", (data) => {
//   console.error(`stderr: ${data}`);
// });
