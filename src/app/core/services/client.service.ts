import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Client } from '../models';

@Injectable({
    providedIn: 'root'
})
export class ClientService extends ApiService<Client> {
    protected override endpoint = 'clients';
}
