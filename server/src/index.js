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

  let itemsProcessed = 0;

  const readStream = createReadStream(CSV_PATH);

  const csvToJsonTransformStream = Transform.toWeb(csvtojson());

  const transformStream = new TransformStream({
    transform: (chunk, controller) => {
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
    write: async (chunk) => {
      await setTimeout(1000);

      itemsProcessed++;
      response.write(chunk);
    },

    close: () => response.end(),
  });

  Readable.toWeb(readStream)
    .pipeThrough(csvToJsonTransformStream)
    .pipeThrough(transformStream)
    .pipeTo(writableStream);

  response.writeHead(200, headers);

  request.once("close", () => {
    console.log(`Connection closed, ${itemsProcessed} items processed`);
  });
});

server
  .listen(PORT)
  .on("listening", () => console.log(`Server running at ${PORT}`));
