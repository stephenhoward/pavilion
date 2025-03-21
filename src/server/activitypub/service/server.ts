import { DateTime } from "luxon";
import { EventEmitter } from "events";
import config from 'config';

import { Account } from "@/common/model/account";
import { WebFingerResponse } from "@/server/activitypub/model/webfinger";
import { UserProfileResponse } from "@/server/activitypub/model/userprofile";
import { ActivityPubActivity } from "@/server/activitypub/model/base";
import { ActivityPubInboxMessageEntity, EventActivityEntity, FollowedAccountEntity, SharedEventEntity } from "@/server/activitypub/entity/activitypub";
import AccountService from "@/server/accounts/service/account";


class ActivityPubService extends EventEmitter {

    constructor() {
        super();
    }

    /**
     * parse the webfinger resource format into username and domain
     * @param resource 
     * @returns { username, domain}
     */
    parseWebFingerResource(resource: string): { username: string, domain: string } {
        resource = resource.replace('acct:', '');
        let parts = resource.split('@');

        if ( parts.length === 2 && parts[0].length > 0 && parts[1].length > 0 ) {
            return { username: parts[0], domain: parts[1] };
        }

        return { username: '', domain: '' };
    }

    /**
     * Generate a webfinger response for the provided username
     * @param username 
     * @param domain 
     * @returns WebFingerResponse message
     */
    // TODO: something useful with the domain info (validation?)
    async lookupWebFinger(username: string, domain: string): Promise<WebFingerResponse|null> {
        let account = await AccountService.getAccountFromUsername(username,domain);

        if ( account ) {
            return new WebFingerResponse(account.username, account.domain || config.get('domain'));
        }

        return null;
    }

    /**
     * Generate an actor message for the provided username
     * @param username 
     * @param domain 
     * @returns UserProfileResponse message
     */
    async lookupUserProfile(username: string): Promise<UserProfileResponse|null> {
        let account = await AccountService.getAccountFromUsername(username,config.get('domain'));

        if ( account ) {
            return new UserProfileResponse(account.username, account.domain || config.get('domain'));
        }

        return null;
    }

    /**
     * Add provided message to the account's inbox
     * @param account
     * @param message 
     * @returns null
     */
    // TODO permissions? block lists? rate limiting?
    async addToInbox(account: Account, message: ActivityPubActivity ): Promise<null> {
        let foundAccount = await AccountService.getAccount(account.id);

        if ( foundAccount === null ) {
            throw new Error('Account not found');
        }

        let messageEntity = await ActivityPubInboxMessageEntity.findByPk(message.id);
        if ( ! messageEntity ) {
            messageEntity = ActivityPubInboxMessageEntity.build({
                id: message.id,
                account_id: account.id,
                type: message.type,
                message_time: message.published,
                message: message
            });
            await messageEntity.save();
        }

        this.emit('inboxMessageAdded', { account_id: account.id, id: messageEntity.id });

        return null;
    }

    /**
     * 
     * @param account Retrieve messages from the outbox of the provided account
     * @param limit 
     * @returns a list of ActivityPubMessage objects
     */
    async readOutbox(account: Account, limit?: DateTime): Promise<ActivityPubActivity[]> {
        let messageEntities = await ActivityPubInboxMessageEntity.findAll({
            where: { account_id: account.id },
            order: [['created_at', 'DESC']]
        });

        return messageEntities.map( (message) => message.toModel() );
    }

}

export default ActivityPubService;
