import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { SlashCommandBuilder } from 'discord.js';
import { readFileSync } from 'fs';

import DiscordInteraction from 'src/domains/discord/interaction';
import { Command } from 'src/decorator/command.decorator';
import { InteractionReply } from './reply';
import { ConfigService } from '@nestjs/config';
import { Time } from 'src/common/time';
import { Cache } from 'cache-manager';

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
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) {}

    async send(interaction: DiscordInteraction) {
        const cachedResult = await this.cacheManager.get<string>(this.cacheKey);
        if (cachedResult) {
            return interaction.reply(this.successResponse(cachedResult));
        }

        // @todo db에 저장해서 읽어오도록 바꾸기
        const githubIds = readFileSync('./scripts/output/ids.txt', { encoding: 'utf-8' }).split(
            '\n',
        );

        const eventsByUsers = await Promise.all(
            githubIds.map(async (githubId) => this.getGithubEventOfUser(githubId)),
        );

        const mostCommiterIndex = this.getMostCommiterIndex(eventsByUsers);
        const mostCommiter = githubIds[mostCommiterIndex];
        await this.cacheManager.set(this.cacheKey, mostCommiter, 60);

        interaction.reply(this.successResponse(mostCommiter));
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

    private successResponse(mostCommiter: string): string {
        return `오늘 가장 많은 잔디를 심은 매쉬업 멤버는.. \`${mostCommiter}\` 입니다!!`;
    }
}
