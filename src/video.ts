import { CustomCanvasFunctionArgs } from "editly";
import { Clip, Layer } from "editly";

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

const convertStringArrayToCzech = (array: string[]) => {
  // a, b, c a d

  if (array.length === 1) return array[0];

  if (array.length === 2) return array.join(" a ");

  return array.slice(0, -1).join(", ") + " a " + array[array.length - 1];
};

export const randomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const getTextFuncton = (text: string, start: number, end: number) => {
  function getLines(ctx: any, text: string, maxWidth: number) {
    var words = text.split(" ");
    var lines = [];
    var currentLine = words[0];

    for (var i = 1; i < words.length; i++) {
      var word = words[i];
      var width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  const func: editly.CustomCanvasFunction = ({
    canvas,
  }: CustomCanvasFunctionArgs) => {
    const maxFontSize = canvas.width / 10;
    const delay = 0.02;

    async function onRender(progress: number) {
      const context = canvas.getContext("2d");
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      context.beginPath();

      context.font = maxFontSize + "px Ubuntu";
      const lines = getLines(context, text, canvas.width - 100);

      const s =
        1 - Math.pow(1 - Math.min((-Math.abs(2 * progress - 1) + 1) * 5, 1), 3); // one fitfh animation in

      const sVals = lines.map((_, i) => {
        const slope = 2 / (1 - (lines.length - 1) * delay);
        return (
          1 -
          Math.pow(
            1 -
              Math.max(
                Math.min(
                  (-Math.abs(slope * Math.max(progress - i * delay, 0) - 1) +
                    1) *
                    4,
                  1
                ),
                0
              ),
            3
          )
        );
      });

      // custom font

      context.fillStyle = "white";
      context.textAlign = "center";

      lines.forEach((line, index) => {
        context.font = Math.max(sVals[index] * maxFontSize, 1) + "px Ubuntu";
        if (Math.max(sVals[index] * maxFontSize, 1) === 1) return;

        context.fillText(
          line,
          centerX,
          centerY + (index - lines.length / 2 + 0.5) * (maxFontSize * 1.4)
        );
      });
    }

    function onClose() {
      // Cleanup if you initialized anything
    }

    return { onRender, onClose };
  };

  return func;
};

export const createVideo = async (
  formattedText: string[],
  marks: TimeMark[],
  audioTrack: string,
  alsoNameday: string[]
) => {
  console.log(marks);

  let durations = marks.map((mark, index) => {
    return mark.timeSeconds - (marks[index - 1]?.timeSeconds || 0);
  });

  const videoLength = durations.reduce((a, b) => a + b, 0);

  const randomClipName = `mc_${randomNumber(0, 39)
    .toString()
    .padStart(3, "0")}.mp4`;

  const editly = await getEditly();

  const clip: Clip = {
    duration: videoLength,
    layers: [
      {
        type: "video",
        path: `./videos/${randomClipName}`,
        cutTo: videoLength,
      },
      {
        type: "fill-color",
        color: "#00000066",
      },
      ...formattedText.map((text, index) => {
        const start = marks[index - 1]?.timeSeconds
          ? marks[index - 1].timeSeconds + 0.3
          : 0;
        const end = marks[index].timeSeconds + 0.3;

        return {
          type: "canvas",
          start: start,
          stop: end,
          func: getTextFuncton(text, start, end),
        } as Layer;
      }),
      ...(alsoNameday.length
        ? [
            {
              type: "subtitle",
              text: `Dnes ${
                alsoNameday.length == 1 ? "má" : "mají"
              } také svátek ${convertStringArrayToCzech(alsoNameday)}`,
              stop: marks[0].timeSeconds,
            } as Layer,
          ]
        : []),
    ],
  };

  const video = await editly({
    width: 810,
    height: 1440,
    fps: 60,
    outPath: "output.mp4",
    audioFilePath: audioTrack,
    clips: [clip],
    defaults: {
      transition: {
        duration: 0,
      },
    },
    // fast: true,
    // some compress options
    // customOutputArgs: ["-compression_level", "5"],
  });

  return video;
};
