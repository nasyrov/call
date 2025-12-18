import { env } from "~/env";

const YANDEX_GPT_URL =
  "https://llm.api.cloud.yandex.net/foundationModels/v1/completion";

interface Message {
  role: "system" | "user" | "assistant";
  text: string;
}

interface CompletionRequest {
  modelUri: string;
  completionOptions: {
    stream: boolean;
    temperature: number;
    maxTokens: string;
  };
  messages: Message[];
}

interface CompletionResponse {
  result: {
    alternatives: Array<{
      message: {
        role: string;
        text: string;
      };
      status: string;
    }>;
    usage: {
      inputTextTokens: string;
      completionTokens: string;
      totalTokens: string;
    };
    modelVersion: string;
  };
}

interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

export async function chat(
  systemPrompt: string,
  userMessage: string,
  options: ChatOptions = {},
): Promise<string> {
  if (!env.YANDEX_API_KEY || !env.YANDEX_FOLDER_ID) {
    throw new Error("Yandex credentials not configured");
  }

  const { temperature = 0.6, maxTokens = 2000 } = options;

  const request: CompletionRequest = {
    modelUri: `gpt://${env.YANDEX_FOLDER_ID}/yandexgpt-lite`,
    completionOptions: {
      stream: false,
      temperature,
      maxTokens: String(maxTokens),
    },
    messages: [
      { role: "system", text: systemPrompt },
      { role: "user", text: userMessage },
    ],
  };

  const response = await fetch(YANDEX_GPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Api-Key ${env.YANDEX_API_KEY}`,
      "x-folder-id": env.YANDEX_FOLDER_ID,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Yandex GPT request failed: ${errorText}`);
  }

  const data = (await response.json()) as CompletionResponse;

  const result = data.result?.alternatives?.[0]?.message?.text;
  if (!result) {
    throw new Error("No response from Yandex GPT");
  }

  return result;
}
