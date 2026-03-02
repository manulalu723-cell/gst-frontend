import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Period } from '../models';

@Injectable({
    providedIn: 'root',
})
export class PeriodService extends ApiService<Period> {
    protected override endpoint = 'periods';
}
