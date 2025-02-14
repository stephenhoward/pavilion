import { describe, it, expect, beforeEach, afterEach, assertType } from 'vitest';
import sinon from 'sinon';

import CreateActivity from '@/server/activitypub/model/action/create';
import UpdateActivity from '@/server/activitypub/model/action/update';
import DeleteActivity from '@/server/activitypub/model/action/delete';
import FollowActivity from '@/server/activitypub/model/action/follow';
import AnnounceActivity from '@/server/activitypub/model/action/announce';
import UndoActivity from '@/server/activitypub/model/action/undo';
import { ActivityPubInboxMessageEntity } from '@/server/activitypub/entity/activitypub';

describe('toModel', () => {
    it('should fail to make a message', async () => {
        let testEntity = ActivityPubInboxMessageEntity.build({
            type: 'NotAValidType'
        });

        expect( () => testEntity.toModel() ).toThrowError('Invalid message type: "NotAValidType"');
    });

    it('should make a create message', async () => {

        let testEntity = ActivityPubInboxMessageEntity.build({ id: 'testId1', type: 'Create', message: { object: { id: 'testObjectId' } }});

        assertType<CreateActivity>( testEntity.toModel() )
    });

    it('should make an update message', async () => {

        let testEntity = ActivityPubInboxMessageEntity.build({ id: 'testId1', type: 'Update', message: { object: { id: 'testObjectId' } } });

        assertType<UpdateActivity>( testEntity.toModel() )
    });

    it('should make a delete message', async () => {

        let testEntity = ActivityPubInboxMessageEntity.build({ id: 'testId1', type: 'Delete', message: {} });

        assertType<DeleteActivity>( testEntity.toModel() )
    });

    it('should make a follow message', async () => {

        let testEntity = ActivityPubInboxMessageEntity.build({ id: 'testId1', type: 'Follow', message: {} });

        assertType<FollowActivity>( testEntity.toModel() )
    });

    it('should make an announce message', async () => {

        let testEntity = ActivityPubInboxMessageEntity.build({id: 'testId1', type: 'Announce', message: {} });

        assertType<AnnounceActivity>( testEntity.toModel() )
    });

    it('should make an undo message', async () => {

        let testEntity = ActivityPubInboxMessageEntity.build({ id: 'testId1', type: 'Undo', message: {} });

        assertType<UndoActivity>( testEntity.toModel() )
    });
});