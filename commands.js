import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';

const CHALLENGE_COMMAND = {
    name: 'whitelist',
    description: 'Whitelist a Minecraft user',
    options: [
        {
          type: 3,
          name: 'username',
          description: 'Minecraft username',
          required: true,
        },
    ],
    type: 1,
    integration_types: [0],
    contexts: [0]
};


const ALL_COMMANDS = [ CHALLENGE_COMMAND ];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
