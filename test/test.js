const assert = require('power-assert');
const helper = require('../src/helper.js');
const mysql = require('../index');

describe('helper', function () {
  it('fillColumns *', function () {
    const sql = [];
    helper.fillColumns('t1', '*', sql);
    assert(sql.join(' ') === '*');
  });

  it('fillColumns empty string', function () {
    const sql = [];
    helper.fillColumns('t1', '', sql);
    assert(sql.join(' ') === '*');
  });

  it('fillColumns empty array', function () {
    const sql = [];
    helper.fillColumns('t1', [], sql);
    assert(sql.join(' ') === '*');
  });

  it('fillColumns array', function () {
    const sql = [];
    helper.fillColumns('t1', ['f1', 'f2', ['f3', 'f33']], sql);
    assert(sql.join(' ') === '`t1`.`f1`, `t1`.`f2`, `t1`.`f3` AS `f33`');
  });

  it('fillColumns object', function () {
    const sql = [];
    helper.fillColumns('t1', {
      t1: ['f1', 'f2', ['f3', 'f33']],
      t2: ['f4'],
    }, sql);
    assert(sql.join(' ') === '`t1`.`f1`, `t1`.`f2`, `t1`.`f3` AS `f33`, `t2`.`f4`');
  });

  it('fillColumns object with *', function () {
    const sql = [];
    helper.fillColumns('t1', {
      t1: '*',
      t2: ['f1'],
    }, sql);
    assert(sql.join(' ') === '`t1`.*, `t2`.`f1`');
  });

  it('fillJoins object', function () {
    const sql = [];
    const values = [];
    helper.fillJoins('t1', null, {
      t2: ['f1', 'f2'],
      t3: ['f3', 'f4'],
    }, sql, values);
    assert(sql.join(' ') === 'LEFT JOIN `t2` ON `t1`.`f1` = `t2`.`f2` LEFT JOIN `t3` ON `t1`.`f3` = `t3`.`f4`');
    assert(values.join(', ') === [].join(', '));
  });

  it('fillJoins array', function () {
    const sql = [];
    const values = [];
    helper.fillJoins('t1', null, [
      ['t2', 'f1', 'f2'],
      ['t3', 'f3', 'f4'],
    ], sql, values);
    assert(sql.join(' ') === 'LEFT JOIN `t2` ON `t1`.`f1` = `t2`.`f2` LEFT JOIN `t3` ON `t1`.`f3` = `t3`.`f4`');
    assert(values.join(', ') === [].join(', '));
  });

  it('fillJoins array 2', function () {
    const sql = [];
    const values = [];
    helper.fillJoins('t1', null, [
      {
        left: ['t1', 't2'],
        on: ['f1', 'f2'],
      },
      {
        left: ['t1', 't3'],
        on: ['f3', 'f4'],
      }
    ], sql, values);
    assert(sql.join(' ') === 'LEFT JOIN `t2` ON `t1`.`f1` = `t2`.`f2` LEFT JOIN `t3` ON `t1`.`f3` = `t3`.`f4`');
    assert(values.join(', ') === [].join(', '));
  });

  it('fillJoins with alias', function () {
    const sql = [];
    helper.fillJoins('t', {
      t: 't1',
      p: 't1',
    }, {
      p: ['f1', 'f2'],
    }, sql);
    assert(sql.join(' ') === 'LEFT JOIN `t1` AS `p` ON `t`.`f1` = `p`.`f2`');
  });

  it('fillWheres single table exp(array)', function () {
    const sql = [];
    const values = [];
    helper.fillWheres('t1', ['f1', '=', 1], sql, values);
    assert(sql.join(' ') === 'WHERE `t1`.`f1` = ?');
    assert(values.join(', ') === [1].join(', '));
  });

  it('fillWheres single table array', function () {
    const sql = [];
    const values = [];
    helper.fillWheres('t1', [
      ['f1', '=', 1],
      ['f2', '=', 2],
    ], sql, values);
    assert(sql.join(' ') === 'WHERE `t1`.`f1` = ? AND `t1`.`f2` = ?');
    assert(values.join(', ') === [1, 2].join(', '));
  });

  it('fillWheres single table array with or', function () {
    const sql = [];
    const values = [];
    helper.fillWheres('t1', [
      ['f1', '=', 1],
      ['f2', '=', 2],
      {
        or: [
          ['f3', '=', 3],
          ['f4', '=', 4],
        ],
      },
    ], sql, values);
    assert(sql.join(' ') === 'WHERE `t1`.`f1` = ? AND `t1`.`f2` = ? OR ( `t1`.`f3` = ? AND `t1`.`f4` = ? )');
    assert(values.join(', ') === [1, 2, 3, 4].join(', '));
  });

  it('fillWheres single table array with deep or', function () {
    const sql = [];
    const values = [];
    helper.fillWheres('t1', [
      ['f1', '=', 1],
      {
        or: ['f2', '=', 2],
      },
      {
        or: [
          ['f3', '=', 3],
          {
            or: ['f4', '=', 4],
          },
          {
            or: [
              ['f5', '=', 5],
              {
                or: ['f6', '=', 6],
              },
              {
                or: ['f7', '=', 7],
              },
            ],
          },
        ],
      },
    ], sql, values);
    assert(sql.join(' ') === 'WHERE `t1`.`f1` = ? OR `t1`.`f2` = ? OR ( `t1`.`f3` = ? OR `t1`.`f4` = ? OR ( `t1`.`f5` = ? OR `t1`.`f6` = ? OR `t1`.`f7` = ? ) )');
    assert(values.join(', ') === [1, 2, 3, 4, 5, 6, 7].join(', '));
  });

  it('fillWheres single table operators', function () {
    const sql = [];
    const values = [];
    helper.fillWheres('t1', [
      ['f1', '=', 1],
      ['f2', '!=', 2],
      ['f3', '<>', 3],
      ['f4', '>', 4],
      ['f5', '>=', 5],
      ['f6', '<', 6],
      ['f7', '<=', 7],
      ['f8', 'like', 'abc%'],
      ['f9', 'notlike', 'abc%'],
      ['f10', 'in', [1, 2, 3]],
      ['f11', 'notin', [1, 2, 3]],
      ['f12', 'between', [1, 2]],
      ['f13', 'notbetween', [1, 2]],
      ['f14', 'null'],
      ['f15', 'notnull'],
    ], sql, values);
    assert(sql.join(' ') === 'WHERE `t1`.`f1` = ? AND `t1`.`f2` != ? AND `t1`.`f3` <> ? AND `t1`.`f4` > ? AND `t1`.`f5` >= ? AND `t1`.`f6` < ? AND `t1`.`f7` <= ? AND `t1`.`f8` LIKE ? AND `t1`.`f9` NOT LIKE ? AND `t1`.`f10` IN (?) AND `t1`.`f11` NOT IN (?) AND `t1`.`f12` BETWEEN ? AND ? AND `t1`.`f13` NOT BETWEEN ? AND ? AND `t1`.`f14` IS NULL AND `t1`.`f15` IS NOT NULL');
    assert(values.join(', ') === [1, 2, 3, 4, 5, 6, 7, 'abc%', 'abc%', [1, 2, 3], [1, 2, 3], 1, 2, 1, 2].join(', '));
  });

  it('fillWheres multiple table', function () {
    const sql = [];
    const values = [];
    helper.fillWheres('t1', [
      {
        t1: ['f1', '=', 1],
      },
      {
        t2: ['f2', '=', 2],
      },
    ], sql, values);
    assert(sql.join(' ') === 'WHERE `t1`.`f1` = ? AND `t2`.`f2` = ?');
    assert(values.join(', ') === [1, 2].join(', '));
  });

  it('fillWheres multiple table with or', function () {
    const sql = [];
    const values = [];
    helper.fillWheres('t1', [
      ['f1', '=', 1],
      {
        t2: ['f2', '=', 2],
      },
      {
        or: {
          t3: [
            ['f3', '=', 3],
            {
              t4: ['f4', '=', 4],
            },
          ],
        },
      },
    ], sql, values);
    assert(sql.join(' ') === 'WHERE `t1`.`f1` = ? AND `t2`.`f2` = ? OR ( `t3`.`f3` = ? AND `t4`.`f4` = ? )');
    assert(values.join(', ') === [1, 2, 3, 4].join(', '));
  });

  it('fillOrders array', function () {
    const sql = [];
    helper.fillOrders('t1', ['f1', 'f2', ['f3', 'desc']], sql);
    assert(sql.join(' ') === 'ORDER BY `t1`.`f1` ASC, `t1`.`f2` ASC, `t1`.`f3` DESC');
  });

  it('fillOrders object', function () {
    const sql = [];
    helper.fillOrders('t1', {
      t1: ['f1', 'f2', ['f3', 'desc']],
      t2: ['f4'],
    }, sql);
    assert(sql.join(' ') === 'ORDER BY `t1`.`f1` ASC, `t1`.`f2` ASC, `t1`.`f3` DESC, `t2`.`f4` ASC');
  });

  it('fillLimits', function () {
    const sql = [];
    const values = [];
    helper.fillLimits(10, 10, sql, values);
    assert(sql.join(' ') === 'LIMIT ?, ?');
    assert(values.join(', ') === [10, 10].join(', '));
  });
});

describe('select', function () {
  it('only pass table t1', function () {
    const {
      sql,
    } = mysql.select('t1');
    assert(sql === 'SELECT * FROM `t1`');
  });

  it('columns [\'f1\']', function () {
    const {
      sql,
    } = mysql.select('t1', { columns: ['f1'] });
    assert(sql === 'SELECT `t1`.`f1` FROM `t1`');
  });

  it('joins {t2: [\'f1\', \'f2\']}', function () {
    const {
      sql,
    } = mysql.select('t1', { joins: { t2: ['f1', 'f2'] } });
    assert(sql === 'SELECT * FROM `t1` LEFT JOIN `t2` ON `t1`.`f1` = `t2`.`f2`');
  });

  it('wheres {f1: 1}', function () {
    const {
      sql,
      values,
    } = mysql.select('t1', { wheres: { f1: 1 } });
    assert(sql === 'SELECT * FROM `t1` WHERE `t1`.`f1` = ?');
    assert(values.join(', ') === '1');
  });

  it('wheres joins, and, or', function () {
    const {
      sql,
      values,
    } = mysql.select('t1', {
      joins: {
        t2: ['f1', 'f2'],
      },
      wheres: [
        ['f3', '=', 3],
        {
          and: [
            ['f4', '=', 4],
            {
              or: ['f5', '=', 5],
            },
            {
              or: {
                t2: ['f6', '=', 6],
              },
            },
          ],
        },
      ],
    });
    assert(sql === 'SELECT * FROM `t1` LEFT JOIN `t2` ON `t1`.`f1` = `t2`.`f2` WHERE `t1`.`f3` = ? AND ( `t1`.`f4` = ? OR `t1`.`f5` = ? OR `t2`.`f6` = ? )');
    assert(values.join(', ') === '3, 4, 5, 6');
  });

  it('orders [\'f1\']', function () {
    const {
      sql,
    } = mysql.select('t1', { orders: ['f1'] });
    assert(sql === 'SELECT * FROM `t1` ORDER BY `t1`.`f1` ASC');
  });

  it('page 1 size 10', function () {
    const {
      sql,
      values,
    } = mysql.select('t1', { page: 1, size: 10 });
    assert(sql === 'SELECT * FROM `t1` LIMIT ?, ?');
    assert(values.join(', ') === '0, 10');
  });

  it('page 10 size 10', function () {
    const {
      sql,
      values,
    } = mysql.select('t1', { page: 10, size: 10 });
    assert(sql === 'SELECT * FROM `t1` LIMIT ?, ?');
    assert(values.join(', ') === '90, 10');
  });

  it('offset 0 limit 10', function () {
    const {
      sql,
      values,
    } = mysql.select('t1', { offset: 0, limit: 10 });
    assert(sql === 'SELECT * FROM `t1` LIMIT ?, ?');
    assert(values.join(', ') === '0, 10');
  });

  it('offset 10 limit 10', function () {
    const {
      sql,
      values,
    } = mysql.select('t1', { offset: 10, limit: 10 });
    assert(sql === 'SELECT * FROM `t1` LIMIT ?, ?');
    assert(values.join(', ') === '10, 10');
  });

  it('mixins', function () {
    const {
      sql,
      values,
    } = mysql.select('t1', {
      columns: {
        t1: ['f1'],
        t2: ['f2'],
      },
      joins: {
        t2: ['f1', 'f2'],
      },
      wheres: {
        f1: 1,        
      },
      orders: ['f1'],
      page: 1,
      size: 10,
    });
    assert(sql === 'SELECT `t1`.`f1`, `t2`.`f2` FROM `t1` LEFT JOIN `t2` ON `t1`.`f1` = `t2`.`f2` WHERE `t1`.`f1` = ? ORDER BY `t1`.`f1` ASC LIMIT ?, ?');
    assert(values.join(', ') === '1, 0, 10');
  });

  it('alias table name', function () {
    const {
      sql,
    } = mysql.select('t', {
      alias: {
        t: 't1',
      },
    });
    assert(sql === 'SELECT * FROM `t1` AS `t`');
  });

  it('joins with alias', function () {
    const {
      sql,
    } = mysql.select('t', {
      alias: {
        t: 't1',
        p: 't1',
      },
      joins: {
        p: ['f1', 'f2'],
      },
      columns: {
        t: '*',
        p: [['f3', 'f3333']],
      },
    });
    assert(sql === 'SELECT `t`.*, `p`.`f3` AS `f3333` FROM `t1` AS `t` LEFT JOIN `t1` AS `p` ON `t`.`f1` = `p`.`f2`');
  });

  it('joins with alias 2', function () {
    const {
      sql,
    } = mysql.select('t', {
      alias: {
        t: 't1',
        p: 't1',
      },
      joins: [
        {
          left: ['t', 'p'],
          on: ['f1', 'f2'],
        },
      ],
      columns: {
        t: '*',
        p: [['f3', 'f3333']],
      },
    });
    assert(sql === 'SELECT `t`.*, `p`.`f3` AS `f3333` FROM `t1` AS `t` LEFT JOIN `t1` AS `p` ON `t`.`f1` = `p`.`f2`');
  });

  it('joins with alias 3', function () {
    const {
      sql,
    } = mysql.select('t', {
      alias: {
        t: 't1',
        p: 't1',
      },
      joins: [
        ['p', 'f1', 'f2'],
      ],
      columns: {
        t: '*',
        p: [['f3', 'f3333']],
      },
    });
    assert(sql === 'SELECT `t`.*, `p`.`f3` AS `f3333` FROM `t1` AS `t` LEFT JOIN `t1` AS `p` ON `t`.`f1` = `p`.`f2`');
  });

  it('where is empty object', function () {
    const {
      sql,
    } = mysql.select('t', {
      wheres: {},
    });
    assert(sql === 'SELECT * FROM `t`');
  });

  it('where is empty array', function () {
    const {
      sql,
    } = mysql.select('t', {
      wheres: [],
    });
    assert(sql === 'SELECT * FROM `t`');
  });

  it('distinct', function () {
    const {
      sql,
    } = mysql.select('t1', {
      distinct: true,
      columns: ['f1'],
    });
    assert(sql === 'SELECT DISTINCT `t1`.`f1` FROM `t1`');
  });

  it('subQuery in', function () {
    const {
      sql,
      values,
    } = mysql.select('t1', {
      wheres: [
        ['f0', '=', 0],
        ['f1', 'IN', mysql.subQuery('t2', {
          columns: ['f2'],
          wheres: {
            f3: 3,
          },
        })],
        ['f4', '=', 4],
      ],
    });
    assert(sql === 'SELECT * FROM `t1` WHERE `t1`.`f0` = ? AND `t1`.`f1` IN ( SELECT `t2`.`f2` FROM `t2` WHERE `t2`.`f3` = ? ) AND `t1`.`f4` = ?');
    assert(values.join(', ') === '0, 3, 4');
  });

  it('subQuery not in', function () {
    const {
      sql,
      values,
    } = mysql.select('t1', {
      wheres: [
        ['f0', '=', 0],
        ['f1', 'NOT IN', mysql.subQuery('t2', {
          columns: ['f2'],
          wheres: {
            f3: 3,
          },
        })],
        ['f4', '=', 4],
      ],
    });
    assert(sql === 'SELECT * FROM `t1` WHERE `t1`.`f0` = ? AND `t1`.`f1` NOT IN ( SELECT `t2`.`f2` FROM `t2` WHERE `t2`.`f3` = ? ) AND `t1`.`f4` = ?');
    assert(values.join(', ') === '0, 3, 4');
  });

  it('subQuery exists', function () {
    const {
      sql,
      values,
    } = mysql.select('t1', {
      wheres: [
        ['f0', '=', 0],
        ['EXISTS', mysql.subQuery('t2', {
          columns: ['f2'],
          wheres: {
            f3: 3,
          },
        })],
        ['f4', '=', 4],
      ],
    });
    assert(sql === 'SELECT * FROM `t1` WHERE `t1`.`f0` = ? AND EXISTS ( SELECT `t2`.`f2` FROM `t2` WHERE `t2`.`f3` = ? ) AND `t1`.`f4` = ?');
    assert(values.join(', ') === '0, 3, 4');
  });

  it('subQuery not exists', function () {
    const {
      sql,
      values,
    } = mysql.select('t1', {
      wheres: [
        ['f0', '=', 0],
        ['NOT EXISTS', mysql.subQuery('t2', {
          columns: ['f2'],
          wheres: {
            f3: 3,
          },
        })],
        ['f4', '=', 4],
      ],
    });
    assert(sql === 'SELECT * FROM `t1` WHERE `t1`.`f0` = ? AND NOT EXISTS ( SELECT `t2`.`f2` FROM `t2` WHERE `t2`.`f3` = ? ) AND `t1`.`f4` = ?');
    assert(values.join(', ') === '0, 3, 4');
  });

  it('nested subQuery', function () {
    const {
      sql,
      values,
    } = mysql.select('t1', {
      wheres: [
        ['f1', 'in', mysql.subQuery('t2', {
          columns: ['f2'],
          wheres: ['f3', 'in', mysql.subQuery('t3', {
            columns: ['f4'],
            wheres: {
              f5: 1,
            },
          })],
        })],
      ],
    });
    assert(sql === 'SELECT * FROM `t1` WHERE `t1`.`f1` IN ( SELECT `t2`.`f2` FROM `t2` WHERE `t2`.`f3` IN ( SELECT `t3`.`f4` FROM `t3` WHERE `t3`.`f5` = ? ) )');
    assert(values.join(', ') === '1');
  });

  it('raw where', function () {
    const {
      sql,
      values,
    } = mysql.select('t1', {
      wheres: mysql.raw('1 = 1'),
    });
    assert(sql === 'SELECT * FROM `t1` WHERE 1 = 1');
    assert(values.join(', ') === '');
  });

  it('raw where 2', function () {
    const {
      sql,
      values,
    } = mysql.select('t1', {
      columns: [mysql.raw('ABS(`t1`.`f1`)')],
      wheres: {
        f2: 1,
        f3: mysql.raw('ABS(?)', [-1]),
      },
    });
    assert(sql === 'SELECT ABS(`t1`.`f1`) FROM `t1` WHERE `t1`.`f2` = ? AND `t1`.`f3` = ABS(?)');
    assert(values.join(', ') === '1, -1');
  });

  it('raw where 3', function () {
    const {
      sql,
      values,
    } = mysql.select('t1', {
      columns: [
        [mysql.raw('ABS(`t1`.`f0`)'), 'f0'],
        mysql.raw('ABS(`t1`.`f1`)'),
      ],
      wheres: [
        ['f2', '=', mysql.raw('ABS(?)', [1])],
        mysql.raw('`t1`.`f3` = ABS(?)', [-1]),
        {
          or: mysql.raw('`t1`.`f4` = ABS(?)', [-2]),
        },
      ],
    });
    assert(sql === 'SELECT ABS(`t1`.`f0`) AS `f0`, ABS(`t1`.`f1`) FROM `t1` WHERE `t1`.`f2` = ABS(?) AND `t1`.`f3` = ABS(?) OR `t1`.`f4` = ABS(?)');
    assert(values.join(', ') === '1, -1, -2');
  });

  it('now', function () {
    const {
      sql,
      values,
    } = mysql.select('t1', {
      columns: [
        'f1',
        mysql.now(),
      ],
      wheres: [
        ['f2', '<', mysql.now()],
      ],
    });
    assert(sql === 'SELECT `t1`.`f1`, NOW() FROM `t1` WHERE `t1`.`f2` < NOW()');
    assert(values.join(', ') === '');
  });
});

describe('total', function () {
  it('total', function () {
    const {
      sql,
      values,
    } = mysql.total('t1', {
      columns: {
        t1: ['f1'],
        t2: ['f2'],
      },
      joins: {
        t2: ['f1', 'f2'],
      },
      wheres: {
        f1: 1,        
      },
      orders: ['f1'],
      page: 1,
      size: 10,
    });
    assert(sql === 'SELECT COUNT(*) AS `total` FROM `t1` LEFT JOIN `t2` ON `t1`.`f1` = `t2`.`f2` WHERE `t1`.`f1` = ? ORDER BY `t1`.`f1` ASC');
    assert(values.join(', ') === '1');
  });
});

describe('insert', function () {
  it('insert', function () {
    const {
      sql,
      values,
    } = mysql.insert('t1', {
      f1: 1,
      f2: 2,
    });
    assert(sql === 'INSERT INTO `t1` (`t1`.`f1`, `t1`.`f2`) VALUES (?, ?)');
    assert(values.join(', ') === '1, 2');
  });
});

describe('update', function () {
  it('update', function () {
    const {
      sql,
      values,
    } = mysql.update('t1', {
      f1: 1,
      f2: 2,
    }, {
      f3: 3,
    });
    assert(sql === 'UPDATE `t1` SET `t1`.`f1` = ?, `t1`.`f2` = ? WHERE `t1`.`f3` = ?');
    assert(values.join(', ') === '1, 2, 3');
  });
});

describe('delete', function () {
  it('delete', function () {
    const {
      sql,
      values,
    } = mysql.delete('t1', {
      f1: 1,
    });
    assert(sql === 'DELETE FROM `t1` WHERE `t1`.`f1` = ?');
    assert(values.join(', ') === '1');
  });
});
