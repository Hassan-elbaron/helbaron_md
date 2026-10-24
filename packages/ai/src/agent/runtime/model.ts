import type { Model } from "@earendil-works/pi-ai";

import type { AiProviderConfig } from "@helbaron/providers";

export function createPiAgentModel(provider: AiProviderConfig, modelId: string): Model<any> {
  return {
    api: "helbaron-native-chat",
    baseUrl: provider.baseUrl ?? "",
    contextWindow: 0,
    cost: {
      cacheRead: 0,
      cacheWrite: 0,
      input: 0,
      output: 0
    },
    id: modelId,
    input: ["text"],
    maxTokens: 0,
    name: modelId,
    provider: provider.id,
    reasoning: false
  };
}
