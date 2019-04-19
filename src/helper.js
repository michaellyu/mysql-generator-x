const {
  isObject,
  isArray,
  isString,
} = require('./utils');

const helper = {
  fillColumns,
  fillJoins,
  fillWhere,
  fillWheres,
  fillOrders,
  fillLimits,
};

/*
 * columns: '*'
 * OR
 * columns: ['f1, 'f2', ['f3', 'f33']],
 * OR
 * columns: {
 *   t1: ['f1', 'f2', ['f3', 'f33']],
 *   t2: ['f4'],
 * },
 */
function fillColumns(table, columns, sql) {
  if (!columns || columns === '*' || (isArray(columns) && !columns.length)) {
    sql.push('*');
  } else if (isArray(columns)) {
    sql.push(genColumns(table, columns));
  } else if (isObject(columns)) {
    sql.push(
      Object
        .keys(columns)
        .map(tb => genColumns(tb, columns[tb]))
        .join(', ')
    );
  }
}

function genColumns(table, columns) {
  return columns
    .map((column) => {
      if (isArray(column) && column.length > 1) {
        return `\`${table}\`.\`${column[0]}\` AS \`${column[1]}\``;
      } else {
        return `\`${table}\`.\`${column}\``;
      }
    })
    .join(', ');
}

/*
 * joins: {
 *   t2: ['f1', 'f2'],
 *   t3: ['f3', 'f4'],
 * }
 * OR
 * joins: [
 *   ['t2', 'f1', 'f2'],
 *   ['t3', 'f3', 'f4'],
 * ]
 * OR
 * joins: [
 *   {
 *     left: ['t1', 't2'],
 *     on: ['f1', 'f2'],
 *   },
 *   {
 *     left: ['t1', 't3'],
 *     on: ['f3', 'f4'],
 *   },
 * ]
 */
function fillJoins(table, joins, sql) {
  if (isObject(joins)) {
    Object
      .keys(joins)
      .forEach((tb) => {
        sql.push(`LEFT JOIN \`${tb}\` ON \`${table}\`.\`${joins[tb][0]}\` = \`${tb}\`.\`${joins[tb][1]}\``);
      });
  } else if (isArray(joins)) {
    joins
      .forEach((join) => {
        if (isObject(join)) {
          let tables;
          let joinType;
          if (join.inner) {
            tables = join.inner;
            joinType = 'INNER JOIN';
          } else if (join.left) {
            tables = join.left;
            joinType = 'LEFT JOIN';
          } else if (join.right) {
            tables = join.right;
            joinType = 'RIGHT JOIN';
          } else if (join.join) {
            tables = join.join;
            joinType = 'JOIN';
          } else if (join.cross) {
            tables = join.cross;
            joinType = 'CROSS JOIN';
          } else {
            return;
          }
          sql.push(`${joinType} \`${tables[1]}\` ON \`${tables[0]}\`.\`${join.on[0]}\` = \`${tables[1]}\`.\`${join.on[1]}\``);
        } else if (isArray(join)) {
          sql.push(`LEFT JOIN \`${join[0]}\` ON \`${table}\`.\`${join[1]}\` = \`${join[0]}\`.\`${join[2]}\``);
        }
      });
  }
}

/*
 * where: {
 *   id: 1,
 *   pid: 2,
 * }
 * OR
 * where: [
 *   ['id', '=', 1],
 *   ['pid', '=', 2],
 *   {
 *     or: ['qid', '=', 3],
 *   },
 *   {
 *     or: [
 *       ['mid', '=', 4],
 *       ['nid', '=', 5],
 *     ],
 *   },
 *   {
 *     and: ['kid', '=', 6],
 *   },
 * ]
 */
function fillWhere(table, where, sql, values) {
  if (isObject(where)) {
    if (where.or) {
      sql.push('OR');
      sql.push('(');
      fillWhere(table, where.or, sql, values);
      sql.push(')');
    } else if (where.and) {
      sql.push('AND');
      sql.push('(');
      fillWhere(table, where.and, sql, values);
      sql.push(')');
    } else {
      Object
        .keys(where)
        .forEach((field, index) => {
          if (index > 0) {
            sql.push('AND');
          }
          genWhere(table, [field, '=', where[field]], sql, values);
        });
    }
  } else if (isArray(where)) {
    if (isExp(where)) {
      genWhere(table, where, sql, values);
    } else {
      where
        .forEach((wh, index) => {
          if (isExp(wh)) {
            if (index > 0) {
              sql.push('AND');
            }
            genWhere(table, wh, sql, values);
          } else {
            fillWhere(table, wh, sql, values);
          }
        });
    }
  }
}

/*
 * wheres: {
 *   f1: 1,
 *   f2: 2,
 * }
 * OR
 * wheres: [
 *   ['f1', '=', 1],
 *   ['f2', '=', 2],
 *   {
 *     or: ['f3', '=', 3],
 *   },
 *   {
 *     or: [
 *       ['f4', '=', 4],
 *       ['f5', '=', 5],
 *     ],
 *   },
 *   {
 *     and: ['f6', '=', 6],
 *   },
 * ]
 * OR
 * wheres: [
 *   {
 *     t1: ['f1', '=', 1],
 *     t2: [
 *       ['f2', '=', 2],
 *       {
 *         or: ['f3', '=', 3],
 *       },
 *     ],
 *   },
 * ]
 */
function fillWheres(table, wheres, sql, values) {
  if (isObject(wheres) && Object.keys(wheres).length) {
    sql.push('WHERE');
    Object
      .keys(wheres)
      .forEach((field, index) => {
        if (index > 0) {
          sql.push('AND');
        }
        genWhere(table, [field, '=', wheres[field]], sql, values);
      });
  } else if (isArray(wheres) && wheres.length) {
    sql.push('WHERE');
    genWheres(table, wheres, sql, values);
  }
}

function genWheres(table, wheres, sql, values) {
  if (isObject(wheres)) {
    if (wheres.or) {
      sql.push('OR');
      sql.push('(');
      genWheres(table, wheres.or, sql, values);
      sql.push(')');
    } else { // multiple table
      Object
        .keys(wheres)
        .forEach((tb, index) => {
          if (isObject(wheres[tb])) {
            if (wheres[tb].or) {
              sql.push('OR');
              sql.push('(');
              genWheres(tb, wheres[tb].or, sql, values);
              sql.push(')');
            } else {
              if (index > 0) {
                sql.push('AND');
              }
              genWheres(tb, wheres[tb].or, sql, values);
            }
          } else {
            if (index > 0) {
              sql.push('AND');
            }
            genWheres(tb, wheres[tb], sql, values);
          }
        });
    }
  } else if (isArray(wheres)) {
    if (isExp(wheres)) {
      genWhere(table, wheres, sql, values);
    } else {
      wheres
        .forEach((where, index) => {
          if (isObject(where)) {
            if (where.or) {
              sql.push('OR');
              sql.push('(');
              genWheres(table, where.or, sql, values);
              sql.push(')');
            } else { // multiple table
              if (index > 0) {
                sql.push('AND');
              }
              Object
                .keys(where)
                .forEach((tb, idx) => {
                  if (idx > 0) {
                    sql.push('AND');
                  }
                  genWheres(tb, where[tb], sql, values);
                });
            }
          } else if (isArray(where)) {
            if (index > 0) {
              sql.push('AND');
            }
            genWheres(table, where, sql, values);
          }
        });
    }
  }
}

function genWhere(table, [field, operator, value], sql, values) {
  switch (operator.toUpperCase()) {
    case '=':
    case '!=':
    case '<>':
    case '>':
    case '>=':
    case '<':
    case '<=':
      sql.push(`\`${table}\`.\`${field}\` ${operator} ?`);
      values.push(value);
      break;
    case 'LIKE':
      sql.push(`\`${table}\`.\`${field}\` LIKE ?`);
      values.push(value);
      break;
    case 'NOTLIKE':
      sql.push(`\`${table}\`.\`${field}\` NOT LIKE ?`);
      values.push(value);
      break;
    case 'IN':
      sql.push(`\`${table}\`.\`${field}\` IN (?)`);
      values.push(value);
      break;
    case 'NOTIN':
      sql.push(`\`${table}\`.\`${field}\` NOT IN (?)`);
      values.push(value);
      break;
    case 'BETWEEN':
      sql.push(`\`${table}\`.\`${field}\` BETWEEN ? AND ?`);
      values.push(value[0]);
      values.push(value[1]);
      break;
      break;
    case 'NOTBETWEEN':
      sql.push(`\`${table}\`.\`${field}\` NOT BETWEEN ? AND ?`);
      values.push(value[0]);
      values.push(value[1]);
      break;
    case 'NULL':
    case 'ISNULL':
    case 'IS NULL':
      sql.push(`\`${table}\`.\`${field}\` IS NULL`);
      break;
    case 'NOTNULL':
    case 'NOT NULL':
    case 'ISNOTNULL':
    case 'IS NOT NULL':
      sql.push(`\`${table}\`.\`${field}\` IS NOT NULL`);
      break;
    default:
      sql.push(`\`${table}\`.\`${field}\` = ?`);
      values.push(operator);
  }
}

function isExp(exp) {
  return exp && isArray(exp) && isString(exp[0]);
}

/*
 * orders: ['f1', 'f2', ['f3', 'desc']]
 * OR
 * orders: [
 *   {
 *     t1: ['f1', 'f2', ['f3', 'desc']],
 *   },
 *   {
 *     t2: ['f4'],
 *   },
 * ]
 */
function fillOrders(table, orders, sql) {
  if (isArray(orders) && orders.length) {
    sql.push('ORDER BY');
    sql.push(genOrders(table, orders));
  } else if (isObject(orders)) {
    sql.push('ORDER BY');
    sql.push(
      Object
        .keys(orders)
        .map((tb) => genOrders(tb, orders[tb]))
        .join(', ')
    );
  }
}

function genOrders(table, orders) {
  return orders
    .map((field) => {
      if (isArray(field) && field.length > 1 && field[1].toUpperCase() === 'DESC') {
        return `\`${table}\`.\`${field[0]}\` DESC`;
      } else {
        return `\`${table}\`.\`${field}\` ASC`;
      }
    })
    .join(', ');
}

function fillLimits(page = 1, size = 10, sql, values) {
  sql.push('LIMIT ?, ?');
  values.push((page - 1) * size);
  values.push(size * 1);
}

module.exports = helper;
