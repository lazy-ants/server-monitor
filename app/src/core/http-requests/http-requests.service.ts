import { Injectable, HttpService } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AxiosResponse, AxiosError } from 'axios';

import { ConfigService } from '../config/config.service';

@Injectable()
export class HttpRequestsService {
    constructor(private readonly httpService: HttpService, private readonly configService: ConfigService) {}

    request(query: any): Observable<AxiosResponse | AxiosError> {
        return this.httpService
            .post(this.configService.get('WEBHOOK_URL'), query, {
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .pipe(map(response => response.data));
    }
}
