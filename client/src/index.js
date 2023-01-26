async function getAnimes(signal) {
  const API_URL = "http://localhost:3333";
  const response = await fetch(API_URL, { signal });

  const textDecoderStream = new TextDecoderStream();

  const reader = response.body
    .pipeThrough(textDecoderStream)
    .pipeThrough(convertNdJsonToJsonObject());

  return reader;
}

function convertNdJsonToJsonObject() {
  let ndJsonBuffer = "";

  return new TransformStream({
    transform: (chunk, controller) => {
      ndJsonBuffer += chunk;

      const items = ndJsonBuffer.split("\n");

      items
        .slice(0, -1)
        .forEach((item) => controller.enqueue(JSON.parse(item)));

      ndJsonBuffer = items[items.length - 1];
    },

    flush: (controller) => {
      if (!ndJsonBuffer) return;

      controller.enqueue(JSON.parse(ndJsonBuffer));
    },
  });
}

function appendAnimeCardToHmtl(element) {
  return new WritableStream({
    write: ({ title, description, urlAnime }) => {
      const card = `
        <article>
          <div class="text">
            <h3>${title.slice(0, 100)}</h3>

            <p>${description.slice(0, 100)}</p>

            <a href="${urlAnime}" target="_blank" rel="noopener noreferrer">Anime link here</a>
          </div>
        </article>
      `;

      element.innerHTML += card;
    },

    abort: (reason) => console.warn(`Request aborted with - ${reason}`),
  });
}

async function main() {
  let abortController = new AbortController();
  const [startButton, stopButton, cardsGrid] = ["start", "stop", "cards"].map(
    (elementId) => document.getElementById(elementId)
  );

  startButton.addEventListener("click", async () => {
    const readable = await getAnimes(abortController.signal);

    readable.pipeTo(appendAnimeCardToHmtl(cardsGrid));
  });

  stopButton.addEventListener("click", () => {
    abortController.abort();

    abortController = new AbortController();
  });
}

await main();
