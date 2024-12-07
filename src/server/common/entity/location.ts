import { Model, Table, Column, PrimaryKey, BelongsTo, DataType, ForeignKey, HasMany } from 'sequelize-typescript';
import { EventLocation } from '../../../common/model/location';
import { AccountEntity } from './account';
import db from './db';

@Table({ tableName: 'location' })
class LocationEntity extends Model {
    @PrimaryKey
    @Column({ type: DataType.STRING })
    declare id: string;

    @ForeignKey(() => AccountEntity)
    @Column({ type: DataType.UUID })
    declare accountId: string;

    @Column({ type: DataType.STRING })
    declare name: string;

    @Column({ type: DataType.STRING })
    declare address: string;

    @Column({ type: DataType.STRING })
    declare city: string;

    @Column({ type: DataType.STRING })
    declare state: string;

    @Column({ type: DataType.STRING })
    declare postal_code: string;

    @Column({ type: DataType.STRING })
    declare country: string;

    @BelongsTo(() => AccountEntity)
    declare account: AccountEntity;

    toModel(): EventLocation {
        return new EventLocation( this.name, this.address, this.city, this.state, this.postal_code, this.country );
    }

    static fromModel(location: EventLocation): LocationEntity {
        return LocationEntity.build({
            name: location.name,
            address: location.address,
            city: location.city,
            state: location.state,
            postal_code: location.postalCode,
            country: location.country
        });
    }
}

db.addModels([LocationEntity]);

export {
    LocationEntity
};