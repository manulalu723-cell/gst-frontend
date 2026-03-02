import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { User } from '../models';

@Injectable({
  providedIn: 'root',
})
export class StaffService extends ApiService<User> {
  protected override endpoint = 'staff';
}
