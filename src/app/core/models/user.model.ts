export type UserRole = 'Admin' | 'Staff';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
    active: boolean;
}
