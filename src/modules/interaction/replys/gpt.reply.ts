import { Injectable, Inject } from '@nestjs/common';
import { Client, SlashCommandBuilder } from 'discord.js';
import { DISCORD_CLIENT } from 'src/constant/discord';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Command } from 'src/decorator/command.decorator';
import { InteractionReply } from './reply';
import DiscordInteraction from 'src/domains/discord/interaction';

@Command(
    new SlashCommandBuilder()
        .setName('gpt')
        .setDescription('chatGpt Going On...')
        .addStringOption((option) => {
            return option.setName('msg').setDescription('Say what you want!').setRequired(true);
        }),
)
@Injectable()
export class GptReply implements InteractionReply {
    constructor(
        @Inject(DISCORD_CLIENT) private readonly client: Client,
        private readonly httpService: HttpService,
    ) {}

    async send(interaction: DiscordInteraction) {
        const msg = interaction.options.getString('msg');
        await interaction.deferReply();
        const answer = (
            await firstValueFrom(
                this.httpService.get(`http://20.196.206.177:5001/?room=discord&query='${msg}'`),
            )
        ).data;
        interaction.editReply(answer);
    }
}
