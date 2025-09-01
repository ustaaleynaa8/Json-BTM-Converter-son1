export interface User {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    createdAt?: Date;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    token?: string;
    user?: User;
}
