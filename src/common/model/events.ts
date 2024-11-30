import { Model, PrimaryModel } from './model';

class CalendarEvent extends PrimaryModel {
    date: string = '';
    location: string = '';
    parentEvent: CalendarEvent | null = null;
    _content: Record<string, CalendarEventContent> = {};

    constructor(id?: string, date?: string, location?: string) {
        super(id);
        this.date = date ?? '';
        this.location = location ?? '';
    }

    content(language: string): CalendarEventContent {
        if ( ! this._content[language] ) {
            this._content[language] = new CalendarEventContent(language as language);
        }
        return this._content[language];
    }

    addContent(content: CalendarEventContent) {
        this._content[content.language] = content;
    }

    static fromObject(obj: Record<string, any>): CalendarEvent {
        let event = new CalendarEvent(obj.id, obj.date, obj.location);

        if ( obj.content ) {
            for( let [language,strings] of Object.entries(obj.content) ) {
                const content = CalendarEventContent.fromObject(strings as Record<string,any>);
                event.addContent(content);
            }
        }

        return event;
    }

    toObject(): Record<string, any> {
        return {
            id: this.id,
            date: this.date,
            location: this.location,
            content: Object.fromEntries(
                Object.entries(this._content)
                    .map(([language, strings]: [string, CalendarEventContent]) => [language, strings.toObject()])
            )
        };
    }

};

enum language {
    EN = "en",
    ES = "es",
    FR = "fr",
    DE = "de",
    IT = "it"
};

class CalendarEventContent extends Model {
    language: language;
    name: string = '';
    description: string = '';

    constructor( language: language, name?: string, description?: string) {
        super();
        this.name = name ?? '';
        this.description = description ?? '';
        this.language = language;
    }

    static fromObject(obj: Record<string, any>): CalendarEventContent {
        return new CalendarEventContent(obj.language, obj.name, obj.description);
    }

    toObject(): Record<string, any> {
        return {
            language: this.language,
            name: this.name,
            description: this.description
        };
    }

    isEmpty(): boolean {
        return this.name === '' && this.description === '';
    }
};

export {
    CalendarEvent, CalendarEventContent, language
}