import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { OpenApiClient } from '../../open-client.js';
import { registerAuthTools } from './auth.js';
import { registerUserTools } from './user.js';
import { registerMessageTools } from './message.js';
import { registerTokenTools } from './token.js';
import { registerTopicTools } from './topic.js';
import { registerTopicUserTools } from './topic-user.js';
import { registerFriendTools } from './friend.js';
import { registerWebhookTools } from './webhook.js';
import { registerSettingTools } from './setting.js';
import { registerPreTools } from './pre.js';
import { registerChannelTools } from './channel.js';
import { registerClawBotTools } from './clawbot.js';
import { registerFileTools } from './file.js';
import { registerPayTools } from './pay.js';

export function registerAllOpenTools(server: McpServer, client: OpenApiClient): void {
  registerAuthTools(server, client);
  registerUserTools(server, client);
  registerMessageTools(server, client);
  registerTokenTools(server, client);
  registerTopicTools(server, client);
  registerTopicUserTools(server, client);
  registerFriendTools(server, client);
  registerWebhookTools(server, client);
  registerSettingTools(server, client);
  registerPreTools(server, client);
  registerChannelTools(server, client);
  registerClawBotTools(server, client);
  registerFileTools(server, client);
  registerPayTools(server, client);
}
