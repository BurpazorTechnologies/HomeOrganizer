export type CurrentUserRole = {
    id: number;
    name: string;
    guard_name: string;
};

export type CurrentUser = {
    id: number | string;
    email: string | null;
    guard: string | null;
    roles: CurrentUserRole[];
};

export type TesterResponse = {
    role?: string;
    permission?: string;
    guard: string;
    granted: boolean;
    super_admin_override: boolean;
    message: string;
    features: any[];
    jwt_roles?: string[];
};

export type RoleOption = {
    name: string;
    guard: string;
};

export type PermissionOption = {
    name: string;
    guard: string;
};

export type JwtConfig = {
    secret_key: string;
    algorithm: string;
};

