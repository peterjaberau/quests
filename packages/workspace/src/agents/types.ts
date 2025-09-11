import type { LanguageModel } from "ai";

import { z } from "zod";

import type { InternalToolName } from "../tools/all";
import type { AnyAgentTool } from "../tools/types";

import { type AppConfig } from "../lib/app-config/types";
import { type SessionMessage } from "../schemas/session/message";
import { type StoreId } from "../schemas/store-id";

export const AgentNameSchema = z.enum(["code"]);

export interface Agent<T extends AgentTools> {
  agentTools: T;
  getMessages: ({
    appConfig,
    envVariableNames,
    sessionId,
  }: {
    appConfig: AppConfig;
    envVariableNames: string[];
    sessionId: StoreId.Session;
  }) => Promise<SessionMessage.ContextWithParts[]>;
  getTools: () => Promise<AnyAgentTool[]>;
  name: AgentName;
  onFinish: (options: {
    appConfig: AppConfig;
    model: LanguageModel;
    parentMessageId: StoreId.Message;
    sessionId: StoreId.Session;
    signal: AbortSignal;
  }) => Promise<void>;
  onStart: (options: {
    appConfig: AppConfig;
    sessionId: StoreId.Session;
    signal: AbortSignal;
  }) => Promise<void>;
  shouldContinue: (options: {
    messages: SessionMessage.WithParts[];
  }) => Promise<boolean>;
}

export type AgentName = z.output<typeof AgentNameSchema>;

export type AgentTools = Partial<Record<InternalToolName, AnyAgentTool>>;

export type AnyAgent = Agent<AgentTools>;
