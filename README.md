# LLMMap

This little experiment is aimed at visualizing the terms that LLMs are associating with each other.

Every 3 hours, 10 terms are generated based on a term that was previously generated, for each LLM.

You can see the result at [https://llmmap.vercel.app/](https://llmmap.vercel.app/).

## Disclaimer

This is my first Astro project and this project is not meant to be more than a little experiment
and (GH Actions, D3) refresher for me.

## Local fun

To run this locally, you need to have [Node.js](https://nodejs.org/en/) installed.

Then, you can run the following commands:

```bash
npm install -g pnpm # if you don't have pnpm installed already
pnpm install
pnpm run dev
```

## License

[MIT](LICENSE)

