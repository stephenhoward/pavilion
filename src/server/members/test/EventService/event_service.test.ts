import { describe, it, expect, afterEach } from 'vitest';
import sinon from 'sinon';
import EventService from '../service/events';
import { EventEntity, EventContentEntity } from '../../common/entity/event';
import { CalendarEventContent, language } from '../../../common/model/events';
import LocationService from '../service/locations';
import { Account } from '../../../common/model/account';
import { EventLocation } from '../../../common/model/location';

describe('listEvents', () => {

    let sandbox = sinon.createSandbox();

    afterEach(() => {
        sandbox.restore();
    });

    it('should return 0 events', async () => {
        let findEventsStub = sandbox.stub(EventEntity, 'findAll');
        findEventsStub.resolves([]);

        let events = await EventService.listEvents(new Account('id', 'testme', 'testme'));
        expect(events).toEqual([]);
    });

    it('should return 1 event', async () => {
        let findEventsStub = sandbox.stub(EventEntity, 'findAll');
        findEventsStub.resolves([new EventEntity()]);

        let events = await EventService.listEvents(new Account('id', 'testme', 'testme'));
        expect(events.length).toBe(1);
        expect(events[0].content("en").name).toBe('');
    });

    it('should return an event with content', async () => {
        let findEventsStub = sandbox.stub(EventEntity, 'findAll');
        let entity = EventEntity.build({ accountId: 'id' });
        entity.content = [ EventContentEntity.build({language: "en", name: "testName", description: "description"}) ];
        findEventsStub.resolves([entity]);

        let events = await EventService.listEvents(new Account('id', 'testme', 'testme'));
        expect(events[0].content("en").name).toBe('testName');
    });

});

describe('createEvent', () => {

    let sandbox = sinon.createSandbox();

    afterEach(() => {
        sandbox.restore();
    });

    it('should create an event with content', async () => {
        let saveStub = sandbox.stub(EventEntity.prototype, 'save');
        let saveContentStub = sandbox.stub(EventContentEntity.prototype, 'save');
        let eventSpy = sandbox.spy(EventEntity, 'fromModel');
        let contentSpy = sandbox.spy(EventContentEntity, 'fromModel');

        let event = await EventService.createEvent(new Account('testAccountId', 'testme', 'testme'), {
            content: {
                en: {
                    name: "testName",
                    description: "description"
                }
            }
        });

        expect(event.id).toBeDefined();
        expect(eventSpy.returnValues[0].account_id).toBe('testAccountId');
        expect(contentSpy.returnValues[0].event_id).toBe(event.id);
        expect(event.content("en").name).toBe('testName');
        expect(saveStub.called).toBe(true);
        expect(saveContentStub.called).toBe(true);
    });

    it('should create an event with a location', async () => {
        let saveStub = sandbox.stub(EventEntity.prototype, 'save');
        let findLocationStub = sandbox.stub(LocationService, 'findOrCreateLocation');
        let eventSpy = sandbox.spy(EventEntity, 'fromModel');

        findLocationStub.resolves(new EventLocation('testId','testLocation', 'testAddress'));

        let event = await EventService.createEvent(new Account('testAccountId', 'testme', 'testme'), {
            location: {
                name: "testLocation",
                address: "testAddress"
            }
        });

        expect(event.id).toBeDefined();
        expect(eventSpy.returnValues[0].account_id).toBe('testAccountId');
        expect(event.location).toBeDefined();
        expect(saveStub.called).toBe(true);
    })

});

describe('updateEvent', () => {

    let sandbox = sinon.createSandbox();

    afterEach(() => {
        sandbox.restore();
    });

    it('should throw an error if event not found', async () => {
        let findEventStub = sandbox.stub(EventEntity, 'findByPk');
        findEventStub.resolves(undefined);

        await expect(EventService.updateEvent(new Account('testAccountId', 'testme', 'testme'), 'testEventId', {
            content: {
                en: {
                    name: "testName",
                    description: "description"
                }
            }
        })).rejects.toThrow('Event not found');
    });

    it('should throw an error if account does not own event', async () => {
        let findEventStub = sandbox.stub(EventEntity, 'findByPk');
        findEventStub.resolves(new EventEntity({ accountId: 'notTestAccountId' }));

        await expect(EventService.updateEvent(new Account('testAccountId', 'testme', 'testme'), 'testEventId', {
            content: {
                en: {
                    name: "testName",
                    description: "description"
                }
            }
        })).rejects.toThrow('account does not own event');
    });

    it('should update an event', async () => {
        let findEventStub = sandbox.stub(EventEntity, 'findByPk');
        let findEventContentStub = sandbox.stub(EventContentEntity, 'findOne');
        let saveEventStub = sandbox.stub(EventEntity.prototype, 'save');
        let saveContentStub = sandbox.stub(EventContentEntity.prototype, 'save');

        findEventStub.resolves(EventEntity.build({ account_id: 'testAccountId' }));
        findEventContentStub.resolves(EventContentEntity.build({ event_id: 'testEventId', language: 'en' }));

        let updatedEvent = await EventService.updateEvent(new Account('testAccountId', 'testme', 'testme'), 'testEventId', {
            content: {
                en: {
                    name: "updatedName",
                    description: "updatedDescription"
                }
            }
        });

        expect(updatedEvent.content("en").name).toBe('updatedName');
        expect(updatedEvent.content("en").description).toBe('updatedDescription');
        expect(saveContentStub.called).toBe(true);
    });

    it('should delete event content if given empty data', async () => {
        let findEventStub = sandbox.stub(EventEntity, 'findByPk');
        let saveEventStub = sandbox.stub(EventEntity.prototype, 'save');
        let findEventContentStub = sandbox.stub(EventContentEntity, 'findOne');
        let destroyContentStub = sandbox.stub(EventContentEntity.prototype, 'destroy');

        findEventStub.resolves(EventEntity.build({ account_id: 'testAccountId' }));
        findEventContentStub.resolves(EventContentEntity.build({ event_id: 'testEventId', language: 'en' }));

        let updatedEvent = await EventService.updateEvent(new Account('testAccountId', 'testme', 'testme'), 'testEventId', {
            content: {
                en: {}
            }
        });

        expect(updatedEvent.content("en").isEmpty()).toBe(true);
        expect(destroyContentStub.called).toBe(true);
    });

    it('should delete event content if given empty data except for language', async () => {
        let findEventStub = sandbox.stub(EventEntity, 'findByPk');
        let saveEventStub = sandbox.stub(EventEntity.prototype, 'save');
        let findEventContentStub = sandbox.stub(EventContentEntity, 'findOne');
        let destroyContentStub = sandbox.stub(EventContentEntity.prototype, 'destroy');

        findEventStub.resolves(EventEntity.build({ account_id: 'testAccountId' }));
        findEventContentStub.resolves(EventContentEntity.build({ event_id: 'testEventId', language: 'en' }));

        let updatedEvent = await EventService.updateEvent(new Account('testAccountId', 'testme', 'testme'), 'testEventId', {
            content: {
                en: { language: 'en'}
            }
        });

        expect(updatedEvent.content("en").isEmpty()).toBe(true);
        expect(destroyContentStub.called).toBe(true);
    });

    it('should delete event content if given undefined data', async () => {
        let findEventStub = sandbox.stub(EventEntity, 'findByPk');
        let saveEventStub = sandbox.stub(EventEntity.prototype, 'save');
        let findEventContentStub = sandbox.stub(EventContentEntity, 'findOne');
        let destroyContentStub = sandbox.stub(EventContentEntity.prototype, 'destroy');

        findEventStub.resolves(EventEntity.build({ account_id: 'testAccountId' }));
        findEventContentStub.resolves(EventContentEntity.build({ event_id: 'testEventId', language: 'en' }));

        let updatedEvent = await EventService.updateEvent(new Account('testAccountId', 'testme', 'testme'), 'testEventId', {
            content: {
                en: undefined
            }
        });

        expect(updatedEvent.content("en").isEmpty()).toBe(true);
        expect(destroyContentStub.called).toBe(true);
    })

    it('should create event content if not found', async () => {
        let findEventStub = sandbox.stub(EventEntity, 'findByPk');
        let saveEventStub = sandbox.stub(EventEntity.prototype, 'save');
        let findEventContentStub = sandbox.stub(EventContentEntity, 'findOne');
        let createContentStub = sandbox.stub(EventService, 'createEventContent');

        findEventStub.resolves(EventEntity.build({ account_id: 'testAccountId' }));
        findEventContentStub.resolves(undefined);
        createContentStub.resolves(new CalendarEventContent(language.EN, 'updatedName', 'updatedDescription'));

        let updatedEvent = await EventService.updateEvent(new Account('testAccountId', 'testme', 'testme'), 'testEventId', {
            content: {
                en: {
                    name: "updatedName",
                    description: "updatedDescription"
                }
            }
        });

        expect(updatedEvent.content("en").name).toBe('updatedName');
        expect(updatedEvent.content("en").description).toBe('updatedDescription');
        expect(createContentStub.called).toBe(true);
    });

    it('should add a location to an event', async () => {
        let findEventStub = sandbox.stub(EventEntity, 'findByPk');
        let saveEventStub = sandbox.stub(EventEntity.prototype, 'save');
        let findLocationStub = sandbox.stub(LocationService, 'findOrCreateLocation');

        findEventStub.resolves(EventEntity.build({ account_id: 'testAccountId' }));
        findLocationStub.resolves(new EventLocation('testId','testLocation', 'testAddress'));

        let updatedEvent = await EventService.updateEvent(new Account('testAccountId', 'testme', 'testme'), 'testEventId', {
            location: {
                name: "testLocation",
                address: "testAddress"
            }
        });

        expect(saveEventStub.called).toBe(true);
        expect(findLocationStub.called).toBe(true);
        expect(updatedEvent.location).toBeDefined();
        expect(updatedEvent.location?.id === 'testId');
    });

    it('should clear location from an event', async () => {

        let eventEntity = EventEntity.build({ account_id: 'testAccountId', location_id: 'testLocationId' });

        let findEventStub = sandbox.stub(EventEntity, 'findByPk');
        let saveEventStub = sandbox.stub(EventEntity.prototype, 'save');
        let findLocationStub = sandbox.stub(LocationService, 'findOrCreateLocation');

        findEventStub.resolves(eventEntity);
        findLocationStub.resolves(new EventLocation('testId','testLocation', 'testAddress'));

        let updatedEvent = await EventService.updateEvent(new Account('testAccountId', 'testme', 'testme'), 'testEventId', {});

        expect(saveEventStub.called).toBe(true);
        expect(findLocationStub.called).toBe(false);
        expect(updatedEvent.location).toBeNull();
        expect(eventEntity.location_id).toBe('');
    });


});
