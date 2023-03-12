import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import {
    ChatInputCommandInteraction,
    Client,
    Collection,
    Message,
    REST,
    Routes,
    SlashCommandBuilder,
} from 'discord.js';
import { Model } from 'mongoose';
import { DISCORD_CLIENT } from 'src/constant/discord';

import DiscordInteraction from 'src/domains/discord/interaction';
import DiscordMessage from 'src/domains/discord/message';
import { DiscordInteractionMapper } from 'src/mongo/mappers/discord-interaction.mapper';
import { DiscordMessageMapper } from 'src/mongo/mappers/discord-message.mapper';
import {
    DiscordInteractionDocument,
    DiscordInteractionModel,
} from 'src/mongo/schemas/discord-interaction.schema';
import {
    DiscordMessageDocument,
    DiscordMessageModel,
} from 'src/mongo/schemas/discord-message.schema';
import InteractionReplyFactory from '../interaction/interaction-reply-factory';
import MessageReplyFactory from '../message/message-reply-factory';

interface DiscordClient extends Client {
    commands?: Collection<any, any>;
}

@Injectable()
export class DiscordService implements OnModuleInit {
    token: string;
    clientId: string;
    // client: DiscordClient;
    constructor(
        @Inject(DISCORD_CLIENT) private readonly client: DiscordClient,
        private readonly configService: ConfigService,
        private readonly messageReplyFactory: MessageReplyFactory,
        private readonly interactionReplyFactory: InteractionReplyFactory,

        @InjectModel(DiscordMessageModel.name)
        private discordMessageModel: Model<DiscordMessageDocument>,
        @InjectModel(DiscordInteractionModel.name)
        private discordInteractionModel: Model<DiscordInteractionDocument>,
    ) {
        this.clientId = this.configService.get('discord.clientId');
        this.token = this.configService.get('discord.token');
    }

    async onModuleInit() {
        /** 연결 이벤트 등록 */
        this.client.on('ready', () => console.log(`${this.client.user.tag} 에 로그인됨`));

        await this.loadInteractionCommand();

        /** 봇 태그해서 보낸 메세지 이벤트 처리 */
        this.client.on('messageCreate', async (aMessage: Message) => {
            const message = new DiscordMessage(aMessage);
            if (!message.forThisBot()) return;

            const createdDiscordMessage = new this.discordMessageModel(
                DiscordMessageMapper.fromDomain(message),
            );
            await createdDiscordMessage.save();

            const reply = this.messageReplyFactory.createReply(message.command);
            reply.send(message);
        });

        /** 명령어 이벤트 처리 */
        this.client.on('interactionCreate', async (aInteraction: ChatInputCommandInteraction) => {
            const interaction = new DiscordInteraction(aInteraction);
            if (!interaction.validate()) return;

            const createdDiscordInteraction = new this.discordInteractionModel(
                DiscordInteractionMapper.fromDomain(interaction),
            );
            await createdDiscordInteraction.save();

            const reply = this.interactionReplyFactory.createReply(interaction);
            reply.send(interaction);
        });

        this.client.login(this.token);
    }

    async loadInteractionCommand() {
        /**
         * @TODO command auto load
         */
        const commands = [
            new SlashCommandBuilder().setName('ping').setDescription('discord Ping'),
            new SlashCommandBuilder().setName('git-pong').setDescription('github Ping'),
            new SlashCommandBuilder()
                .setName('git-repo-contributions')
                .setDescription('get user git repository contributions')
                .addStringOption((option) => {
                    return option
                        .setName('repo-url')
                        .setDescription('name of repository')
                        .setRequired(true);
                }),
            new SlashCommandBuilder()
                .setName('gpt')
                .setDescription('chatGpt Going On...')
                .addStringOption((option) => {
                    return option
                        .setName('msg')
                        .setDescription('Say what you want!')
                        .setRequired(true);
                }),
        ];

        const rest = new REST().setToken(this.token);
        await rest.put(Routes.applicationCommands(this.clientId), {
            body: commands,
        });
    }
}
