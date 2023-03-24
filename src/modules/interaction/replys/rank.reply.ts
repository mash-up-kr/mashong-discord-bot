import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { SlashCommandBuilder } from 'discord.js';

import DiscordInteraction from 'src/domains/discord/interaction';
import { Command } from 'src/decorator/command.decorator';
import { InteractionReply } from './reply';
import { ConfigService } from '@nestjs/config';
import { Time } from 'src/common/time';
import { Cache } from 'cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GitMemberDocument, GitMemberModel } from 'src/mongo/schemas/git-member.schema';

type GithubEvent = {
    id: number;
    type: 'PushEvent' | 'CreateEvent' | 'WatchEvent' | 'ForkEvent';
    actor: object;
    repo: object;
    payload: object;
    public: boolean;
    created_at: Date;
    org: object;
};

@Command(new SlashCommandBuilder().setName('rank').setDescription('Mash-Up Github Jandi Ranking'))
@Injectable()
export class RankReply implements InteractionReply {
    cacheKey = 'MOST_COMMITER';
    ttl = 1000 * 60 * 10;
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
        @InjectModel(GitMemberModel.name)
        private gitMemberModel: Model<GitMemberDocument>,
    ) {}

    async send(interaction: DiscordInteraction) {
        const cachedResult = await this.cacheManager.get<string>(this.cacheKey);
        if (cachedResult) {
            return interaction.reply(this.successResponse(cachedResult));
        }

        const mostCommiter = await this.getMostCommiter();
        await this.cacheManager.set(this.cacheKey, mostCommiter, this.ttl);

        await interaction.reply(this.successResponse(mostCommiter));
    }

    async getMostCommiter(githubIds?: string[]): Promise<string> {
        if (!githubIds) {
            const members = await this.gitMemberModel.find();
            githubIds = members.map((member) => member.githubId);
        }

        const eventsByUsers = await Promise.all(
            githubIds.map(async (githubId) => await this.getGithubEventOfUser(githubId)),
        );

        const mostCommiterIndex = this.getMostCommiterIndex(eventsByUsers);
        const mostCommiter = githubIds[mostCommiterIndex];

        return mostCommiter;
    }

    async getGithubEventOfUser(githubId: string) {
        const response = await this.httpService.axiosRef.get(
            `https://api.github.com/users/${githubId}/events?page=1`,
            {
                headers: {
                    Authorization: `token ${this.configService.get('githubToken')}`,
                },
            },
        );

        return response.data;
    }

    private getMostCommiterIndex(eventsByUsers) {
        const today = Time.now().toFormat('YYYY-MM-DD');

        const todayEventCountByUsers = eventsByUsers.map((eventsByUser) => {
            const todayEventByUser = eventsByUser.filter(isTodayEvent);
            return todayEventByUser.length;
        });

        const result = todayEventCountByUsers.indexOf(Math.max(...todayEventCountByUsers));
        return result;

        function isTodayEvent(event: GithubEvent) {
            const createAt = new Time(event.created_at).toFormat('YYYY-MM-DD');
            return createAt === today;
        }
    }

    private successResponse(mostCommiter: string): { content: string } {
        return {
            content: `오늘 가장 많은 잔디를 심은 매쉬업 멤버는.. \`${mostCommiter}\` 입니다!!`,
        };
    }
}
