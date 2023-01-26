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

function appendToHmtl(element) {
  return new WritableStream({
    write: ({ title, description, urlAnime }) => {
      const card = `
        <article>
          <div class="text">
            <h3>${title}</h3>

            <p>${description}</p>

            <a href="${urlAnime}" target="_blank" rel="noopener noreferrer">Anime link here</a>
          </div>
        </article>
      `;

      element.innerHTML += card;
    },
  });
}

async function main() {
  const [startButton, stopButton, cardsGrid] = ["start", "stop", "cards"].map(
    (elementId) => document.getElementById(elementId)
  );

  const abortController = new AbortController();

  const readable = await getAnimes(abortController.signal);
  readable.pipeTo(appendToHmtl(cardsGrid));
}

await main();
