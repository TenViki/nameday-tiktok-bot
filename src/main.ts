import dotenv from "dotenv";
import { spawn } from "child_process";
import NameDay from "./nameday";

dotenv.config();

const main = async () => {
  const name = new NameDay();
  const names = await name.fetchName({
    fetchOther: false,
  });

  const textData = await name.getWikipediaText(names![0].name);

  console.log(names, textData);
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
