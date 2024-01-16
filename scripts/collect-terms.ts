import 'dotenv/config';
import { resolve, dirname } from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';

import OpenAI from 'openai';
import MistralClient from '@mistralai/mistralai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prompt = `Give me a list of 10 terms that relate to a given term.
The terms may be composed of 2 or 3 words but not more.
Put each term on a new line.
You do not comment on your answer or the terms you give.

EXAMPLE BEGIN
Term: dog
Answer:
cat
puppy
animal
pet
canine
wolf
EXAMPLE END

Term: {term}
Answer:`;

const jsonDirectory = resolve(__dirname, '../public/json');

async function readTerms(name: string) {
  const terms = JSON.parse(await readFile(resolve(jsonDirectory, 'terms', `${name}.json`), 'utf-8'));
  return terms as Record<string, string[] | null>;
}

async function writeTerms(name: string, terms: Record<string, string[] | null>) {
  await mkdir(resolve(jsonDirectory, 'terms'), { recursive: true }).catch(() => { });
  await writeFile(resolve(jsonDirectory, 'terms', `${name}.json`), JSON.stringify(terms));
}

const callsDirectory = resolve(jsonDirectory, 'calls', Date.now().toString());
async function ensureCallsDirectory() {
  await mkdir(callsDirectory, { recursive: true }).catch(() => { });
}

function getGenerationTerms(generation: OpenAI.ChatCompletion) {
  const terms = generation.choices.at(0)?.message.content?.split('\n')
    .map((term) => term.trim().toLowerCase())
    .filter(term => term
      && term.split(' ').length < 4
      && !term.includes(':'))
    ?? [];
  return terms;
}

const mistralClient = new MistralClient();
const openaiClient = new OpenAI();

const clients = {
  mistral: async (modelName: string, term: string) => {
    const response = await mistralClient.chat({
      model: modelName,
      messages: [{ role: 'user', content: prompt.replace('{term}', term) }],
    });
    await writeFile(resolve(callsDirectory, `mistral-${modelName}.json`), JSON.stringify(response));
    return getGenerationTerms(response as OpenAI.ChatCompletion)
  },
  openai: async (modelName: string, term: string) => {
    const response = await openaiClient.chat.completions.create({
      model: modelName,
      messages: [{ role: 'user', content: prompt.replace('{term}', term) }],
    });
    await writeFile(resolve(callsDirectory, `openai-${modelName}.json`), JSON.stringify(response));
    return getGenerationTerms(response)
  }
}

const models: Record<string, (modelName: string, term: string) => Promise<string[]>> = {
  'mistral-tiny': clients.mistral,
  'mistral-small': clients.mistral,
  'mistral-medium': clients.mistral,
  'gpt-3.5-turbo-1106': clients.openai,
  'gpt-4-0613': clients.openai,
};

async function main() {
  await ensureCallsDirectory();

  for (const [modelName, client] of Object.entries(models)) {
    const terms = await readTerms(modelName).catch(() => ({ concept: null } as Record<string, string[] | null>));
    const unprocessedTerm = Object.entries(terms)
      .find(([_, associations]) => !associations);
    if (!unprocessedTerm) {
      console.log(`All terms for ${modelName} have been processed`);
      continue;
    }
    const [term] = unprocessedTerm;
    const associations = await client(modelName, term);
    terms[term] = associations;
    associations.forEach((association) => {
      if (!terms[association]) {
        terms[association] = null;
      }
    });
    await writeTerms(modelName, terms);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

main()
  .then(() => console.log('Done'))
  .catch((err) => console.error(err));