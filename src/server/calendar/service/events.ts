import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import config from 'config';

import { Account } from "@/common/model/account"
import { CalendarEvent, CalendarEventContent, CalendarEventSchedule } from "@/common/model/events"
import { EventContentEntity, EventEntity, EventScheduleEntity } from "@/server/calendar/entity/event"
import { LocationEntity } from "@/server/calendar/entity/location";
import LocationService from "@/server/calendar/service/locations";

/**
 * Service class for managing events
 *
 * @remarks
 * Use this class to manage the lifecycle of events in the system
 */
class EventService extends EventEmitter {

    constructor() {
        super();
    }

    /**
     * retrieves the events for the provided account
     * @param account
     * @returns a promise that resolves to the list of events
     */
    async listEvents(account: Account): Promise<CalendarEvent[]> {

        const events = await EventEntity.findAll({
            where: { account_id: account.id },
            include: [EventContentEntity, LocationEntity, EventScheduleEntity]
        });

        return events.map( (event) => {
            let e = event.toModel();
            if ( event.content ) {
                for ( let c of event.content ) {
                    e.addContent( c.toModel() );
                }
            }
            if ( event.location ) {
                e.location = event.location.toModel();
            }
            if ( event.schedules ) {
                for ( let s of event.schedules ) {
                    e.addSchedule( s.toModel() );
                }
            }

            return e;
        });
    }

    generateEventUrl(account: Account): string {
        const domain = account.domain || config.get('domain');
        return 'https://' + domain + '/events/' + uuidv4();
    }

    /**
     * Creates a new event for the provided account
     * @param account - account the event belongs to
     * @param eventParams - the parameters for the new event
     * @returns a promise that resolves to the created Event
     */
    async createEvent(account: Account, eventParams:Record<string,any>): Promise<CalendarEvent> {

        eventParams.id = this.generateEventUrl(account);

        const event = CalendarEvent.fromObject(eventParams);
        if ( account.profile?.username.length ) {
            event.eventSourceUrl = '/' + account.profile.username + '/' + event.id;
        }
        else {
            event.eventSourceUrl = '';
        }
        const eventEntity = EventEntity.fromModel(event);
        eventEntity.account_id = account.id;

        if( eventParams.location ) {

            let location = await LocationService.findOrCreateLocation(account, eventParams.location);
            eventEntity.location_id = location.id;
            event.location = location;
        }

        eventEntity.save();

        if ( eventParams.content ) {
            for( let [language,content] of Object.entries(eventParams.content) ) {
                event.addContent(await this.createEventContent(event.id, language, content as Record<string,any>));
            }
        }

        if ( eventParams.schedules ) {
            for( let schedule of eventParams.schedules ) {
                event.addSchedule(await this.createEventSchedule(event.id, schedule as Record<string,any>));
            }
        }

        this.emit('eventCreated', { account, event });
        return event;
    }

    async createEventSchedule(eventId: string, scheduleParams: Record<string,any>): Promise<CalendarEventSchedule> {
        const schedule = CalendarEventSchedule.fromObject(scheduleParams);

        schedule.id = uuidv4();
        const scheduleEntity = EventScheduleEntity.fromModel(schedule);
        scheduleEntity.event_id = eventId;
        await scheduleEntity.save();

        return schedule;
    }

    async createEventContent(eventId: string, language: string, contentParams: Record<string,any>): Promise<CalendarEventContent> {
        contentParams.language = language;
        const content = CalendarEventContent.fromObject(contentParams);

        const contentEntity = EventContentEntity.fromModel(content);
        contentEntity.id = uuidv4();
        contentEntity.event_id = eventId;
        await contentEntity.save();

        return content;
    }

    /**
     * updates the event with the provided id
     * @param eventId - the id of the event to update
     * @param eventParams - the parameters and values to update for the event
     * @returns a promise that resolves to the Event
     */
    async updateEvent(account: Account, eventId: string, eventParams:Record<string,any>): Promise<CalendarEvent> {
        const eventEntity = await EventEntity.findByPk(eventId);

        if ( ! eventEntity ) {
            throw new Error('Event not found');
        }

        if ( eventEntity.account_id !== account.id ) {
            throw( new Error('account does not own event') );
        }

        let event = eventEntity.toModel();

        if ( eventParams.content ) {
            for( let [language,content] of Object.entries(eventParams.content) ) {
                let contentEntity = await EventContentEntity.findOne({
                    where: { event_id: eventId, language: language }
                });

                if ( contentEntity ) {

                    if ( ! content ) {
                        await contentEntity.destroy();
                        continue;
                    }

                    let c = content as Record<string,any>;
                    delete c.language;

                    if ( Object.keys(c).length === 0 ) {
                        await contentEntity.destroy();
                        continue;
                    }

                    await contentEntity.update({
                        name: c.name,
                        description: c.description
                    });
                    event.addContent(contentEntity.toModel());
                }
                else {
                    if ( !content ) {
                        continue;
                    }

                    let c = content as Record<string,any>;
                    delete c.language;

                    if ( Object.keys(c).length > 0 ) {
                        event.addContent(await this.createEventContent(eventId, language, c));
                    }
                }
            }
        }

        if ( eventEntity.location_id && ! eventParams.location ) {
            eventEntity.location_id = '';
            event.location = null;
        }
        else if( eventParams.location ) {

            let location = await LocationService.findOrCreateLocation(account, eventParams.location);
            eventEntity.location_id = location.id;
            event.location = location;
        }

        if ( eventParams.schedules ) {
            let existingSchedules = await EventScheduleEntity.findAll({ where: { event_id: eventId } });
            let existingScheduleIds = existingSchedules.map( s => s.id );

            console.log(existingScheduleIds);
            for( let schedule of eventParams.schedules ) {

                if ( schedule.id ) {
                    let scheduleEntity = existingSchedules.find( s => s.id === schedule.id );

                    if ( ! scheduleEntity ) {
                        throw Error ('Schedule not found for event');
                    }

                    existingScheduleIds = existingScheduleIds.filter( id => id !== schedule.id );
                    // TODO: validate schedule data so we don't store junk
                    await scheduleEntity.update({
                        start_date: schedule.startDate ?? scheduleEntity.start_date,
                        end_date: schedule.endDate ?? scheduleEntity.end_date,
                        frequency: schedule.frequency ?? scheduleEntity.frequency,
                        interval: schedule.interval ?? scheduleEntity.interval,
                        count: schedule.count ?? scheduleEntity.count,
                        by_day: schedule.byDay ?? scheduleEntity.by_day,
                        is_exclusion: schedule.isExclusion ?? scheduleEntity.is_exclusion
                    });
                    event.addSchedule(scheduleEntity.toModel());
                }
                else {
                    event.addSchedule(await this.createEventSchedule(eventId, schedule));
                }
            }

            if ( existingScheduleIds.length > 0 ) {
                await EventScheduleEntity.destroy({ where: { id: existingScheduleIds } });
            }
        }

        await eventEntity.save();

        this.emit('eventUpdated', { account, event });
        return event;
    }
}

export default EventService;
