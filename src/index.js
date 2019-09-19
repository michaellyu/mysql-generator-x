const {
  isArray,
  isString,
} = require('./utils');

const {
  fillColumns,
  fillJoins,
  fillWheres,
  fillOrders,
  fillLimits,
} = require('./helper');

const mysql = {
  /*
   * table: 't1', options: {
   *   columns: {
   *     t1: ['f1', 'f2', ['f3', 'f33']],
   *     t2: ['f4'],
   *   },
   *   joins: {
   *     t2: ['f1', 'f2'],
   *   },
   *   wheres: {
   *     f1: 1,
   *   },
   *   wheres: [
   *     ['f1', '=', 1],
   *     {
   *       t2: {
   *         or: [
   *           ['f2', '=', 2],
   *           ['f3', '=', 3],
   *         ],
   *       },
   *     },
   *   ],
   *   orders: {
   *     t1: ['f1'],
   *     t2: [['f2', 'desc']],
   *   },
   *   offset: 0,
   *   limit: 10,
   * }
   */
  select: function (table, options = {}, isCount = false) {
    const sql = [];
    const values = [];
    sql.push('SELECT');
    if (isCount) {
      sql.push('COUNT(*) AS `total`');
    } else {
      fillColumns(table, options.columns, sql);
    }
    sql.push(`FROM`);
    if (options.alias && options.alias[table]) {
      sql.push(`\`${options.alias[table]}\` AS \`${table}\``);
    } else {
      sql.push(`\`${table}\``);
    }
    if (options.joins || options.join) {
      fillJoins(table, options.alias, options.joins || options.join, sql, values);
    }
    if (options.wheres || options.where) {
      fillWheres(table, options.wheres || options.where, sql, values);
    }
    if (options.orders || options.order || options.orderby || options.orderBy) {
      fillOrders(table, options.orders || options.order || options.orderby || options.orderBy, sql, values);
    }
    if (options.limit && !isCount) {
      fillLimits((options.offset || 0) * 1, options.limit * 1, sql, values);
    } else if (options.page && options.size && !isCount) {
      fillLimits((options.page - 1) * options.size, options.size, sql, values);
    }
    return {
      sql: sql.join(' '),
      values,
    };
  },
  /*
   * table: 't1', options: {
   *   columns: {
   *     t1: ['f1', 'f2', ['f3', 'f33']],
   *     t2: ['f4'],
   *   },
   *   joins: {
   *     t2: ['f1', 'f2'],
   *   },
   *   wheres: {
   *     f1: 1,
   *   },
   *   wheres: [
   *     ['f1', '=', 1],
   *     {
   *       t2: {
   *         or: [
   *           ['f2', '=', 2],
   *           ['f3', '=', 3],
   *         ],
   *       },
   *     },
   *   ],
   *   orders: {
   *     t1: ['f1'],
   *     t2: [['f2', 'desc']],
   *   },
   *   page: 1,
   *   size: 10,
   * }
   */
  total: function (table, options = {}) {
    return mysql.select(table, options, true);
  }, 
  /*
   * table: 't1',
   * columns: {
   *   f1: 1,
   *   f2: 2,
   * },
   */
  create: function (table, columns = {}) {
    const values = [];
    const fields = [];
    const places = [];
    Object
      .keys(columns)
      .forEach((field) => {
        fields.push(`\`${table}\`.\`${field}\``);
        places.push('?');
        values.push(columns[field]);
      });
    return {
      sql: `INSERT INTO \`${table}\` (${fields.join(', ')}) VALUES (${places.join(', ')})`,
      values,
    };
  },
  /*
   * table: 't1',
   * columns: {
   *   f1: 1,
   *   f2: 2,
   * },
   * wheres: {
   *   f3: 3,
   * },
   */
  update: function (table, columns, wheres) {
    const sql = [];
    const values = [];
    const fields = [];
    sql.push(`UPDATE \`${table}\` SET`);
    Object
      .keys(columns)
      .forEach((field) => {
        fields.push(`\`${table}\`.\`${field}\` = ?`);
        values.push(columns[field]);
      });
    sql.push(fields.join(', '));
    fillWheres(table, wheres, sql, values);
    return {
      sql: sql.join(' '),
      values,
    };
  },  
  /*
   * table: 't1',
   * wheres: {
   *   f1: 1,
   * },
   */
  delete: function (table, wheres) {
    const sql = [];
    const values = [];
    sql.push(`DELETE FROM \`${table}\``);
    fillWheres(table, wheres, sql, values);
    return {
      sql: sql.join(' '),
      values,
    };
  },
};

module.exports = mysql;
