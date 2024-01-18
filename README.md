# LLMMap

This little experiment is aimed at visualizing the terms that LLMs are associating with each other.

[Every 3 hours](./.github/workflows/collect-terms.yml),
[10 terms are generated *](./scripts/collect-terms.ts) based on a term that was previously generated,
for each LLM.

You can see the result at [https://llmmap.vercel.app/](https://llmmap.vercel.app/).

* At least, it's what the model is supposed to do, but sometimes the
[model generates more than 10 terms](./public/json/calls/1705407474670/mistral-mistral-medium.json).

## Disclaimer

This is my first Astro project and this project is not meant to be more than a little experiment
and (GH Actions, D3) refresher for me.

I may or not play further with this, but I'm not planning to make this a full-fledged project.

## Tech stack

- [Astro](https://astro.build/)
- [D3](https://d3js.org/)
- [Vercel](https://vercel.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [Mistral API](https://docs.mistral.ai/platform)

## Local fun

To run this locally, you need to have [Node.js](https://nodejs.org/en/) installed.

Create a `.env` file at the root of the project and add the following:

```
MISTRAL_API_KEY="<your mistral api key>"
OPENAI_API_KEY="<your openai api key>"
```

Then, you can run the following commands:

```bash
npm install -g pnpm # if you don't have pnpm installed already
pnpm install
pnpm run dev
```

## License

[MIT](LICENSE)

