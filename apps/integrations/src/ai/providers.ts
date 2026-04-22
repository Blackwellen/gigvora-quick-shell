/** AI provider registry (BYOK aware): OpenAI, Anthropic, Gemini, Kimi, Stable Diffusion, Veo, Pixabay, etc. */
import { register, type Adapter } from '../index';

const providers = ['openai','anthropic','gemini','kimi','mistral','groq','perplexity',
                   'stability','pixabay','veo','runway','elevenlabs'] as const;

for (const id of providers) {
  register({
    id, category: 'ai',
    configure() {},
    async healthcheck() {
      const key = process.env[`${id.toUpperCase()}_API_KEY`];
      return { ok: !!key, detail: key ? 'env-configured' : 'BYOK required' };
    },
  } satisfies Adapter);
}
