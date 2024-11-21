import { scryptSync, randomBytes } from 'crypto';
import { AccountEntity, AccountSecretsEntity } from "../entity/account"
import { Account } from "../../../common/model/account"

/**
 * Service class for managing accounts
 *
 * @remarks
 * Use this class to manage the lifecycle of accounts in the system
 */
class AccountService {

    static async getAccountByEmail(email: string): Promise<Account|undefined> {
        const account = await AccountEntity.findOne({ where: {email: email}});

        if ( account ) {
            return account.toModel();
        }
    }

    static async getAccountById(id: string): Promise<Account|undefined> {
        const account = await AccountEntity.findByPk(id);

        if ( account ) {
            return account.toModel();
        }
    }

    static async setPassword(account:Account, password:string): Promise<boolean> {
        const secret = await AccountSecretsEntity.findByPk(account.id);

        if ( secret ) {
            let salt = randomBytes(16).toString('hex');
            let hashed_password = scryptSync(password, salt, 64 ).toString('hex');

            secret.salt = salt;
            secret.password = hashed_password;
            secret.password_reset_code = null;
            secret.password_reset_expiration = null;

            await secret.save();

            return true;
        }
        return false;
    }
}

export default AccountService;