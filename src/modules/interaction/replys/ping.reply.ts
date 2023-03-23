import { Injectable, Inject } from '@nestjs/common';
import { Client, SlashCommandBuilder } from 'discord.js';
import { DISCORD_CLIENT } from 'src/constant/discord';
import { Command } from 'src/decorator/command.decorator';
import DiscordInteraction from 'src/domains/discord/interaction';
import { InteractionReply } from './reply';

@Command(new SlashCommandBuilder().setName('ping').setDescription('discord Ping'))
@Injectable()
export class PingReply implements InteractionReply {
    constructor(@Inject(DISCORD_CLIENT) private readonly client: Client) {}

    send(interaction: DiscordInteraction) {
        interaction.reply(`${this.client.ws.ping}ms Pong!`);
    }
}
