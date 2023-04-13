import { Clip } from "editly";

import type editly from "editly";

const getEditly = async (): Promise<typeof editly> => {
  const lib = await (eval(`import('editly')`) as Promise<{
    default: typeof import("editly");
  }>);
  return lib.default;
};

export interface TimeMark {
  timeSeconds: number;
  name: string;
}

export const createVideo = async (
  formattedText: string[],
  marks: TimeMark[],
  audioTrack: string
) => {
  console.log(marks);

  let durations = marks.map((mark, index) => {
    return mark.timeSeconds - (marks[index - 1]?.timeSeconds || 0);
  });

  console.log(
    "Calculated length:",
    durations.reduce((a, b) => a + b, 0)
  );

  const editly = await getEditly();
  const clips: Clip[] = formattedText.map((text, index) => {
    return {
      layers: [
        {
          type: "fill-color",
          color: "#" + Math.floor(Math.random() * 16777215).toString(16),
        },

        {
          type: "title",
          text,
        },
      ],
      duration:
        marks[index]?.timeSeconds - (marks[index - 1]?.timeSeconds || 0) + 0.5,
    };
  });

  const video = await editly({
    width: 1080,
    height: 1920,
    fps: 60,
    outPath: "output.mp4",
    audioFilePath: audioTrack,
    clips,
  });

  return video;
};
