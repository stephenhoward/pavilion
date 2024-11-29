import Model from './model';

class Account extends Model {
    id: string = '';
    username: string = '';
    email: string = '';
    profile: Profile | null = null;
    roles: string[] | null = null;

    constructor (id?: string, username?: string, email?: string) {
        super();
        this.id = id ?? '';
        this.username = username ?? '';
        this.email = email ?? '';
    };

    hasRole(role: string): boolean {
        if ( this.roles ) {
            return this.roles.includes(role);
        }
        return false;
    }

    toObject(): Record<string,any> {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            profile: this.profile,
            roles: this.roles
        };
    };
    static fromObject(obj: Record<string,any>): Account {
        let account = new Account(obj.id, obj.username, obj.email);
        account.profile = obj.profile;
        account.roles = obj.roles;
        return account;
    }
};

class AccountSecrets {
    accountId: string = '';
    password: string = '';
    url_verification_code: string = '';
};

class Profile {
    declare username: string;
    declare description: string;
    declare url: string;
};

export { Account, AccountSecrets, Profile}