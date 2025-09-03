import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { Role } from '@common/enums/role.enum';

@Entity('user')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: 'varchar', unique: true, nullable: false })
    email: string;

    @Column({ type: 'varchar', length: 150, nullable: false })
    name: string;

    @Column({ type: 'varchar', nullable: false })
    password: string;

    @Column({ type: 'text', default: Role.ADMIN })
    role: Role;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}
