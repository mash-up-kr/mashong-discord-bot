import { Module } from '@nestjs/common';
import { DiscordClientModule } from '../discord/discord-client.module';
import InteractionReplyFactory from './interaction-reply-factory';
import { PingReply } from './replys/ping.reply';
import { GitPingReply } from './replys/git-ping.reply';
import { GitRepoContributionsReply } from './replys/git-repo-contributions.reply';
import { HttpModule } from '@nestjs/axios';
import { GptReply } from './replys/gpt.reply';
import { RankReply } from './replys/rank.reply';
import { GitCodeReply } from './replys/git-code.reply';
import { DiscoveryModule } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { GitMemberModel, GitMemberSchema } from 'src/mongo/schemas/git-member.schema';

@Module({
    imports: [
        DiscordClientModule,
        HttpModule,
        DiscoveryModule,
        MongooseModule.forFeature([
            {
                name: GitMemberModel.name,
                schema: GitMemberSchema,
            },
        ]),
    ],
    providers: [
        PingReply,
        GitPingReply,
        GitRepoContributionsReply,
        GptReply,
        RankReply,
        InteractionReplyFactory,
        GitCodeReply,
    ],
    exports: [InteractionReplyFactory],
})
export class InteractionModule {}
