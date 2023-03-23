import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import {
    ChatInputCommandInteraction,
    Client,
    Collection,
    Events,
    Message,
    Routes,
} from 'discord.js';
import { Model } from 'mongoose';
import { DISCORD_CLIENT } from 'src/constant/discord';
import { COMMAND } from 'src/decorator/command.decorator';

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
    constructor(
        @Inject(DISCORD_CLIENT) private readonly client: DiscordClient,
        private readonly discoveryService: DiscoveryService,
        private readonly reflector: Reflector,
        private readonly messageReplyFactory: MessageReplyFactory,
        private readonly interactionReplyFactory: InteractionReplyFactory,

        @InjectModel(DiscordMessageModel.name)
        private discordMessageModel: Model<DiscordMessageDocument>,
        @InjectModel(DiscordInteractionModel.name)
        private discordInteractionModel: Model<DiscordInteractionDocument>,
    ) {}

    async onModuleInit() {
        /** 연결 이벤트 등록 */
        this.client.on(Events.ClientReady, () =>
            console.log(`${this.client.user.tag} 에 로그인됨`),
        );

        this.loadInteractionCommand();
        this.registerMessageHandler();
        this.registerInteractionHandler();
    }

    /** 봇 태그해서 보낸 메세지 이벤트 처리 */
    registerMessageHandler() {
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
    }

    /** 명령어 이벤트 처리 */
    registerInteractionHandler() {
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
    }

    /** 커맨드 자동 등록 */
    loadInteractionCommand() {
        const providers = this.discoveryService.getProviders();

        const commands = providers
            .filter((wrapper) => wrapper.isDependencyTreeStatic())
            .filter(({ instance }) => instance && Object.getPrototypeOf(instance))
            .map(({ instance }) => {
                const prototype = Object.getPrototypeOf(instance);
                const command = this.reflector.get(COMMAND, prototype);
                return command;
            })
            .filter((value) => value);

        this.client.rest.put(Routes.applicationCommands(this.client.application.id), {
            body: commands,
        });
    }
}
