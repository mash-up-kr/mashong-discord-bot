import moment from 'moment';

export class Time {
    _time: moment.Moment;
    constructor(value?: Date | string, intputFormat?: string) {
        this._time = moment(value, intputFormat);
    }

    static now() {
        return new Time();
    }

    toFormat(outputFormat: string) {
        return this._time.format(outputFormat);
    }
}
