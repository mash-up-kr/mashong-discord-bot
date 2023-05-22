import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ScheduleService {
    private readonly logger = new Logger(ScheduleService.name);

    // @Cron(CronExpression.EVERY_5_SECONDS, {
    //     name: 'common',
    // })
    // handleCron() {
    //     this.logger.debug('Called when the current second is 5');
    // }
}
