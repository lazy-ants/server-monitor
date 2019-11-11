import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { ScheduleService } from './schedule.service';

@Module({
    imports: [CoreModule],
    providers: [ScheduleService],
})
export class ScheduleModule {}
