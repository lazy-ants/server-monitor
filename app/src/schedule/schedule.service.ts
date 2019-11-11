import { Injectable } from '@nestjs/common';
import { Cron, NestSchedule } from 'nest-schedule';
import si from 'systeminformation';
import osu from 'node-os-utils';

import { ConfigService } from '../core/config/config.service';
import { HttpRequestsService } from '../core/http-requests/http-requests.service';

@Injectable()
export class ScheduleService extends NestSchedule {
    nonStableTimes: any = {
        cpu: null,
        mem: null,
        disk: null,
    };

    constructor(
        private readonly configService: ConfigService,
        private readonly httpRequestsService: HttpRequestsService,
    ) {
        super();
    }

    @Cron('* * * * *')
    async monitorServer() {
        Promise.all([osu.cpu.usage(), osu.drive.info(), si.mem()]).then((res: any) => this.monitorReport(res));
    }

    private monitorReport([cpu, drive, mem]: any[]) {
        const rt = +this.configService.get('RESPONSE_TIME');
        const reports = [];

        let cpuState = 1;
        if (cpu >= +this.configService.get('CPU_MAX_USED')) {
            if (!this.nonStableTimes.cpu) {
                this.nonStableTimes.cpu = new Date().getTime();
            } else {
                if (this.nonStableTimes.cpu + rt * 60 * 1000 < new Date().getTime()) {
                    cpuState = 0;
                    this.nonStableTimes.cpu = null;
                }
            }
        } else {
            this.nonStableTimes.cpu = null;
        }

        reports.push(`*CPU*: ${cpu || 0}% load for the last ${rt}min ${cpuState ? '✅' : '⚠️'}`);

        let memState = 1;
        const { available, total } = mem;
        const freeMemPercentage = +((available * 100) / total).toFixed(2);
        const freeMemGb = +(available / (1024 * 1024 * 1024)).toFixed(1);
        if (freeMemPercentage <= 100 - +this.configService.get('MEMORY_MAX_USED')) {
            if (!this.nonStableTimes.mem) {
                this.nonStableTimes.mem = new Date().getTime();
            } else {
                if (this.nonStableTimes.mem + rt * 60 * 1000 < new Date().getTime()) {
                    memState = 0;
                    this.nonStableTimes.mem = null;
                }
            }
        } else {
            this.nonStableTimes.mem = null;
        }

        reports.push(
            `*MEMORY*: ${freeMemPercentage || 0}% / ${freeMemGb}Gb free for the last ${rt}min ${
                memState ? '✅' : '⚠️'
            }`,
        );

        let driveState = 1;
        const { freePercentage, freeGb } = drive;
        if (freePercentage <= 100 - +this.configService.get('DRIVE_MAX_USED')) {
            if (!this.nonStableTimes.drive) {
                this.nonStableTimes.drive = new Date().getTime();
            } else {
                if (this.nonStableTimes.drive + rt * 60 * 1000 < new Date().getTime()) {
                    driveState = 0;
                    this.nonStableTimes.drive = null;
                }
            }
        } else {
            this.nonStableTimes.drive = null;
        }

        reports.push(`*DRIVE*: ${freePercentage || 0}% / ${freeGb}Gb free ${driveState ? '✅' : '⚠️'}`);

        if (!cpuState || !memState || !driveState) {
            const serverIpV4 = this.configService.get('IPV4');
            const serverName = this.configService.get('SERVER_NAME');
            const text = `STATUS, IP *${serverIpV4}*, ${serverName}: \n\n${reports.join('\n')}`;

            this.httpRequestsService.request({ text }).subscribe();
        }
    }
}
