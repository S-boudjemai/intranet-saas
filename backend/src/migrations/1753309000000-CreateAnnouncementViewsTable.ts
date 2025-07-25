import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateAnnouncementViewsTable1753309000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'announcement_views',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'announcement_id',
                        type: 'int',
                        isNullable: false,
                    },
                    {
                        name: 'user_id',
                        type: 'int',
                        isNullable: false,
                    },
                    {
                        name: 'tenant_id',
                        type: 'int',
                        isNullable: false,
                    },
                    {
                        name: 'viewed_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['announcement_id'],
                        referencedTableName: 'announcements',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                    {
                        columnNames: ['user_id'],
                        referencedTableName: 'users',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
                indices: [
                    {
                        name: 'IDX_announcement_views_unique',
                        columnNames: ['announcement_id', 'user_id'],
                        isUnique: true,
                    },
                    {
                        name: 'IDX_announcement_views_tenant',
                        columnNames: ['tenant_id'],
                    },
                    {
                        name: 'IDX_announcement_views_announcement',
                        columnNames: ['announcement_id'],
                    },
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('announcement_views');
    }

}
