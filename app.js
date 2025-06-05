import 'dotenv/config';
import express from 'express';
import { Rcon } from 'rcon-client';
import fs from 'fs/promises';
import {
    InteractionResponseType,
    InteractionType,
    verifyKeyMiddleware,
} from 'discord-interactions';

const app = express();
const PORT = process.env.PORT || 3000;


app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {

    const { id, type, data } = req.body;

    if (type === InteractionType.PING) {
        return res.send({ type: InteractionResponseType.PONG });
    }

    if (type === InteractionType.APPLICATION_COMMAND) {
        const { name } = data;
        if (name === 'whitelist') {
            const username = data.options[0].value;
            try {
                const response = await fetch(`https://playerdb.co/api/player/minecraft/${username}`);
                const data = await response.json();

                if (!data.success) {
                    return res.send({
                        type: 4,
                        data: { content: 'Couldn\'t find anyone by that name.' }
                    });
                }

                const { id: uuid, username: canonicalName } = data.data.player;


                const whitelistPath = `${process.env.WHITELIST_PATH}`;
                const file = await fs.readFile(whitelistPath, 'utf8');
                const whitelist = JSON.parse(file);

                if (whitelist.find(entry => entry.uuid === uuid)) {
                    return res.send({
                        type: 4,
                        data: { content: `${canonicalName} is already whitelisted.` }
                    });
                }

                whitelist.push({ uuid, name: canonicalName });
                await fs.writeFile(whitelistPath, JSON.stringify(whitelist, null, 2));

                const rcon = await Rcon.connect({
                    host: `${process.env.RCON_HOST}`, 
                    port: parseInt(process.env.RCON_PORT), 
                    password: `${process.env.RCON_PASSWORD}`
                });

                await rcon.send('whitelist reload');
                await rcon.end();

                return res.send({
                    type: 4,
                    data: { content: `Whitelisted ${canonicalName}!` }
                });


            } catch (err) {
                console.error(err);
                return res.send({
                    type: 4,
                    data: { content: 'Something went wrong...' }
                });
            }
        }

        console.error(`unknown command: ${name}`);
        return res.status(400).json({ error: 'unknown command' });
    }

    console.error('unknown interaction type', type);
    return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
    console.log('Listening on port', PORT);
});
