import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { join } from "node:path";
import { Readable, Transform } from "node:stream";
import { WritableStream, TransformStream } from "node:stream/web";
import { setTimeout } from "node:timers/promises";

import csvtojson from "csvtojson";

const PORT = 3333;
const CSV_PATH = join("src", "static", "data.csv");

const server = createServer(async (request, response) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*",
  };

  if (request.method === "OPTIONS") {
    response.writeHead(204, headers);
    response.end();

    return;
  }

  let items = 0;

  const transformStream = new TransformStream({
    transform(chunk, controller) {
      const parsedChunk = JSON.parse(Buffer.from(chunk).toString());
      const mappedChunk = {
        title: parsedChunk?.title,
        description: parsedChunk?.description,
        urlAnime: parsedChunk?.url_anime,
      };
      const stringfiedChunk = JSON.stringify(mappedChunk).concat("\n");

      controller.enqueue(stringfiedChunk);
    },
  });

  const writableStream = new WritableStream({
    async write(chunk) {
      await setTimeout(1000);

      items++;
      response.write(chunk);
    },
    close() {
      response.end();
    },
  });

  Readable.toWeb(createReadStream(CSV_PATH))
    .pipeThrough(Transform.toWeb(csvtojson()))
    .pipeThrough(transformStream)
    .pipeTo(writableStream);

  response.writeHead(200, headers);
});

server
  .listen(PORT)
  .on("listening", () => console.log(`Server running at ${PORT}`));
