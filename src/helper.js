const {
  isObject,
  isFunction,
  isArray,
  isString,
} = require('./utils');

const helper = {
  fillColumns,
  fillJoins,
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
  if (isArray(columns)) {
    return columns
      .map((column) => {
        if (isArray(column) && column.length > 1) {
          return `\`${table}\`.\`${column[0]}\` AS \`${column[1]}\``;
        } else {
          return `\`${table}\`.\`${column}\``;
        }
      })
      .join(', ');
  } else if (isString(columns)) {
    if (columns !== '*') {
      return `\`${table}\`.\`${columns}\``;
    } else {
      return `\`${table}\`.*`;
    }
  }
  return '*';
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
function fillJoins(table, alias, joins, sql) {
  if (isObject(joins)) {
    Object
      .keys(joins)
      .forEach((tb) => {
        sql.push(`LEFT JOIN ${alias && alias[tb] ? `\`${alias[tb]}\` AS \`${tb}\`` : `\`${tb}\``} ON \`${table}\`.\`${joins[tb][0]}\` = \`${tb}\`.\`${joins[tb][1]}\``);
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
          sql.push(`${joinType} ${alias && alias[tables[1]] ? `\`${alias[tables[1]]}\` AS \`${tables[1]}\`` : `\`${tables[1]}\``} ON \`${tables[0]}\`.\`${join.on[0]}\` = \`${tables[1]}\`.\`${join.on[1]}\``);
        } else if (isArray(join)) {
          sql.push(`LEFT JOIN ${alias && alias[join[0]] ? `\`${alias[join[0]]}\` AS \`${join[0]}\`` : `\`${join[0]}\``} ON \`${table}\`.\`${join[1]}\` = \`${join[0]}\`.\`${join[2]}\``);
        }
      });
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
  if (isExp(wheres)) {
    sql.push('WHERE');
    genWhere(table, wheres, sql, values);
  } else if (isObject(wheres)) {
    Object
      .keys(wheres)
      .forEach((field, index) => {
        if (index > 0) {
          sql.push('AND');
        } else {
          sql.push('WHERE');
        }
        genWhere(table, [field, '=', wheres[field]], sql, values);
      });
  } else if (isArray(wheres)) {
    wheres
      .forEach((where, index) => {
        if (index > 0) {
          if (where.or) {
            sql.push('OR');
          } else {
            sql.push('AND');
          }
        } else {
          sql.push('WHERE');
        }
        genWheres(table, where, sql, values);
      });
  }
}

function genWheres(table, wheres, sql, values) {
  if (isExp(wheres)) {
    genWhere(table, wheres, sql, values);
  } else if (isObject(wheres)) {
    if (wheres.or) {
      genWheres(table, wheres.or, sql, values);
    } else if (wheres.and) {
      genWheres(table, wheres.and, sql, values);
    } else { // table scope
      Object
        .keys(wheres)
        .forEach((tb, idx) => {
          if (idx > 0) {
            if (wheres[tb].or) {
              sql.push('OR');
            } else {
              sql.push('AND');
            }
          }
          genWheres(tb, wheres[tb], sql, values);
        });
    }
  } else if (isArray(wheres)) {
    sql.push('(');
    wheres
      .forEach((where, index) => {
        if (index > 0) {
          if (where.or) {
            sql.push('OR');
          } else {
            sql.push('AND');
          }
        }
        genWheres(table, where, sql, values);
      });
    sql.push(')');
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
    case 'NOT LIKE':
      sql.push(`\`${table}\`.\`${field}\` NOT LIKE ?`);
      values.push(value);
      break;
    case 'IN':
      if (!isSubQuery(value)) {
        sql.push(`\`${table}\`.\`${field}\` IN (?)`);
        values.push(value);
      } else {
        const subQuery = value();
        sql.push(`\`${table}\`.\`${field}\` IN (${subQuery.sql})`);
        values.push(...subQuery.values);
      }
      break;
    case 'NOTIN':
    case 'NOT IN':
      if (!isSubQuery(value)) {
        sql.push(`\`${table}\`.\`${field}\` NOT IN (?)`);
        values.push(value);
      } else {
        const subQuery = value();
        sql.push(`\`${table}\`.\`${field}\` NOT IN (${subQuery.sql})`);
        values.push(...subQuery.values);
      }
      break;
    case 'BETWEEN':
      sql.push(`\`${table}\`.\`${field}\` BETWEEN ? AND ?`);
      values.push(value[0]);
      values.push(value[1]);
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
      switch (field.toUpperCase()) {
        case 'EXISTS':
          if (isSubQuery(operator)) {
            const subQuery = operator();
            sql.push(`EXISTS (${subQuery.sql})`);
            values.push(...subQuery.values);
          }
          break;
        case 'NOTEXISTS':
        case 'NOT EXISTS':
          if (isSubQuery(operator)) {
            const subQuery = operator();
            sql.push(`NOT EXISTS (${subQuery.sql})`);
            values.push(...subQuery.values);
          }
          break;
        default:
          sql.push(`\`${table}\`.\`${field}\` = ?`);
          values.push(operator);
      }
  }
}

function isExp(exp) {
  return exp && isArray(exp) && isString(exp[0]);
}

function isSubQuery(fn) {
  return fn && isFunction(fn) && fn.name === 'subQuery';
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

function fillLimits(offset = 0, limit = 10, sql, values) {
  sql.push('LIMIT ?, ?');
  values.push(offset);
  values.push(limit);
}

module.exports = helper;
