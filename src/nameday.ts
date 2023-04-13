import axios from "axios";
import cheerio from "cheerio";
// import * as cheerio from "cheerio";
import { decode } from "./decode.util";
import fs from "fs/promises";
import { formatMonth } from "./month.util";
// import { getRandomImage } from "./image.util";
// import puppeteer from "puppeteer";

export interface Name {
  name: string;
  amount: string;
  popularityRank: string;
  averageAge: string;
  day: string;
  origin: string;
  meaning: string;
  area: string;
}

export default class NameDay {
  public names: Name[] | null = null;
  public loaded = false;

  constructor() {}

  async getWikipediaText(name: string) {
    const response = await axios.get(
      encodeURI(
        `https://cs.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&titles=${name}`
      )
    );

    const page = response.data.query.pages;
    const pageId = Object.keys(page)[0];

    const text = page[pageId]?.extract;

    if (!text) return null;

    return text
      .replaceAll("<p>", "")
      .replaceAll("</p>", "\n")

      .replaceAll("<b>", "")
      .replaceAll("</b>", "")

      .replaceAll("<i>", "")
      .replaceAll("</i>", "")

      .replaceAll("<ul>", "")
      .replaceAll("</ul>", "")

      .replaceAll("<li>", "• ")
      .replaceAll("</li>", "");
  }

  async fetchName(options?: {
    url?: string;
    fetchOther?: boolean;
  }): Promise<Name[] | null> {
    const response = await axios.get(
      options?.url || "https://www.nasejmena.cz/nj/cetnost.php",
      {
        responseType: "arraybuffer",
        responseEncoding: "binary",
        headers: {
          "accept-encoding": "gzip, deflate, br",
        },
      }
    );

    const html = decode(response.data);

    const $ = cheerio.load(html);
    const nameText = $(".hlavicka").text();
    const subName = $(".dopinfo").text();

    const nameRegex =
      /((?<=Jméno )[a-zA-ZěščřžýáíéóúůďťňĎŇŤŠČŘŽÝÁÍÉÚŮĚÓ]*)|((?<= má )\d+)|((?<=je na )\d+)|((?<=je )\d+)/gm;
    const matches = nameText.match(nameRegex);
    if (!matches || matches.length < 4) return null;

    const subNameRegex =
      /(\d+\.\d+\.)|((?<=p[uů]vod: )[a-zA-Z ěščřžýáíéóúůďťňĎŇŤŠČŘŽÝÁÍÉÚŮĚÓ]*)|((?<=v[yý]znam: )[a-zA-Z ěščřžýáíéóúůďťňĎŇŤŠČŘŽÝÁÍÉÚŮĚÓ]*)|((?<=oblasti )[a-zA-Z ěščřžýáíéóúůďťňĎŇŤŠČŘŽÝÁÍÉÚŮĚÓ]*)/gm;
    const subMatches = subName.match(subNameRegex);
    if (!subMatches || subMatches.length < 4) return null;

    const name = {
      name: matches[0],
      amount: matches[1],
      popularityRank: matches[2],
      averageAge: matches[3],
      day: subMatches[0],
      origin: subMatches[1],
      meaning: subMatches[2],
      area: subMatches[3],
    };

    const others: Name[] = [];

    if (options?.fetchOther) {
      const a = $(".dolnitext").children();

      let i = 0;

      // fetch max 3 names

      for (const el of a) {
        const text = $(el).text();
        const href = $(el).attr("href");
        if (
          el.name === "a" &&
          href?.match(/cetnost\.php\?id=\d+&typ=jmeno/gm)
        ) {
          i++;
          console.log(i);
          if (i >= 3) break;

          const names = await this.fetchName({
            url: "https://www.nasejmena.cz/nj/" + href,
            fetchOther: false,
          });
          if (!names) continue;

          others.push(names[0]);
        }
      }
    }

    this.names = [name, ...others].slice(0, 3);
    return [name, ...others].slice(0, 3);
  }
}
