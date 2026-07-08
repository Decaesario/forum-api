/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;
export const up = (pgm) => {
    pgm.createTable('authentications', {
        token: {
            type: 'TEXT',
            notNull: true,
        },
    });
};

export const down = (pgm) => {
    pgm.dropTable('authentications');
};