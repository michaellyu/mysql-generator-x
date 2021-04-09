MySQL Generator
===============

A new way to generate mysql statements.

### Installing

```shell
yarn add mysql-generator-x # npm install mysql-generator-x
```

### Usage

```javascript
const mysql = require('mysql-generator-x');

/* SELECT */
// table
var {
  sql, // SELECT * FROM `t1`
  values, // []
} = mysql.select('t1');

// columns
var {
  sql, // SELECT `t1`.`f1`, `t1`.`f2` AS `f222222` FROM `t1`
  values, // []
} = mysql.select('t1', {
  columns: ['f1', ['f2', 'f222222']],
});

// columns with multiple tables
var {
  sql, // SELECT `t1`.`f1`, `t2`.`f2` FROM `t1` LEFT JOIN `t2` ON `t1`.`f1` = `t2`.`f2`
  values, // []
} = mysql.select('t1', {
  columns: {
    t1: ['f1'],
    t2: ['f2'],
  },
  joins: {
    t2: ['f1', 'f2'],
  },
});

// distinct
const {
  sql, // SELECT DISTINCT `t1`.`f1` FROM `t1`
} = mysql.select('t1', {
  distinct: true,
  columns: ['f1'],
});

// joins
var {
  sql, // SELECT * FROM `t1` LEFT JOIN `t2` ON `t1`.`f1` = `t2`.`f2` LEFT JOIN `t3` ON `t1`.`f1` = `t3`.`f3`
  values, // []
} = mysql.select('t1', {
  joins: {
    t2: ['f1', 'f2'],
    t3: ['f1', 'f3'],
  },
});

// joins(inner, left, right, inner, cross)
var {
  sql, // SELECT * FROM `t1` LEFT JOIN `t2` ON `t1`.`f1` = `t2`.`f2` RIGHT JOIN `t3` ON `t1`.`f1` = `t3`.`f3`
  values, // []
} = mysql.select('t1', {
  joins: [
    {
      left: ['t1', 't2'],
      on: ['f1', 'f2'],
    },
    {
      right: ['t1', 't3'],
      on: ['f1', 'f3'],
    },
  ],
});

// joins on
const {
  sql, // SELECT * FROM `t1` LEFT JOIN `t2` ON `t1`.`f1` = `t2`.`f2` OR ( `t1`.`f3` = `t2`.`f4` AND `t1`.`f5` IN (?) AND `t2`.`f6` = ABS(?) ) LEFT JOIN `t3` AS `t0` ON `t2`.`f7` = `t0`.`f8` LEFT JOIN `t3` ON `t2`.`f9` = `t3`.`f10` OR ( `t2`.`f11` = `t3`.`f12` )
  values, // [[1, 2, 3], -1]
} = mysql.select('t1', {
  alias: {
    t0: 't3',
  },
  joins: [
    {
      left: ['t1', 't2'],
      on: [
        [{ table: 't1', column: 'f1'}, '=', { table: 't2', column: 'f2' }],
        {
          or: [
            [{ table: 't1', column: 'f3'}, '=', { table: 't2', column: 'f4'}],
            [{ table: 't1', column: 'f5'}, 'IN', [1, 2, 3]],
            [{ table: 't2', column: 'f6'}, '=', mysql.raw('ABS(?)', [-1])],
          ],
        }
      ],
    },
    {
      left: ['t2', 't0'],
      on: [{ table: 't2', column: 'f7'}, '=', { table: 't0', column: 'f8' }],
    },
    {
      left: ['t2', 't3'],
      on: [
        [{ table: 't2', column: 'f9'}, '=', { table: 't3', column: 'f10' }],
        {
          or: [{ table: 't2', column: 'f11'}, '=', { table: 't3', column: 'f12' }],
        },
      ],
    },
  ],
});

// alias
var {
  sql, // SELECT * FROM `t1` AS `t` LEFT JOIN `t1` AS `p` ON `t`.`f1` = `p`.`f2`
} = mysql.select('t', {
  alias: {
    t: 't1',
    p: 't1',
  },
  joins: {
    p: ['f1', 'f2'],
  },
});

// wheres
var {
  sql, // SELECT * FROM `t1` WHERE `t1`.`f1` = ? AND `t1`.`f2` = ?
  values, // [1, 2]
} = mysql.select('t1', {
  wheres: {
    f1: 1,
    f2: 2,
  },
});

// wheres(=, !=, <>, >, >=, <, <=, null, notnull, like, notlike, between, notbetween, in, notin)
var {
  sql, // SELECT * FROM `t1` WHERE `t1`.`f1` = ? AND `t1`.`f2` > ? OR `t1`.`f3` IN (?)
  values, // [1, 2, [3, 4, 5]]
  } = mysql.select('t1', {
    wheres: [
      ['f1', '=', 1],
      ['f2', '>', 2],
      {
        or: ['f3', 'in', [3, 4, 5]],
      },
    ],
  });

// wheres with multiple tables
var {
  sql, // SELECT * FROM `t1` LEFT JOIN `t2` ON `t1`.`f1` = `t2`.`f2` LEFT JOIN `t3` ON `t1`.`f1` = `t3`.`f3` WHERE `t1`.`f1` = ? AND `t2`.`f2` = ? OR ( `t3`.`f3` = ? AND `t4`.`f4` = ? )
  values, // [1, 2, 3, 4]
} = mysql.select('t1', {
  joins: {
    t2: ['f1', 'f2'],
    t3: ['f1', 'f3'],
  },
  wheres: [
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
  ],
});

// raw
const {
  sql, // SELECT ABS(`t1`.`f0`) AS `f0`, ABS(`t1`.`f1`) FROM `t1` WHERE `t1`.`f2` = ABS(?) AND `t1`.`f3` = ABS(?) OR `t1`.`f4` = ABS(?)
  values, // [1, -1, -2]
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

// orders
var {
  sql, // SELECT * FROM `t1` ORDER BY `t1`.`f1` ASC, `t1`.`f2` DESC
  values, // []
} = mysql.select('t1', {
  orders: ['f1', ['f2', 'desc']],
});

// orders with multiple tables
var {
  sql, // SELECT * FROM `t1` LEFT JOIN `t2` ON `t1`.`f1` = `t2`.`f2` ORDER BY `t1`.`f1` ASC, `t2`.`f2` ASC
  values, // []
} = mysql.select('t1', {
  joins: {
    t2: ['f1', 'f2'],
  },
  orders: {
    t1: ['f1'],
    t2: ['f2'],
  },
});

// offset, limit
var {
  sql, // SELECT * FROM `t1` LIMIT ?, ?
  values, // [0, 10]
} = mysql.select('t1', {
  offset: 0,
  limit: 10,
});

// page, size
var {
  sql, // SELECT * FROM `t1` LIMIT ?, ?
  values, // [0, 10]
} = mysql.select('t1', {
  page: 1,
  size: 10,
});

// mixins
var {
  sql, // SELECT `t1`.`f1`, `t2`.`f2` FROM `t1` LEFT JOIN `t2` ON `t1`.`f1` = `t2`.`f2` WHERE `t1`.`f1` = ? ORDER BY `t1`.`f1` ASC LIMIT ?, ?
  values, // [1, 0, 10]
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

// subQuery
const {
  sql, // SELECT * FROM `t1` WHERE `t1`.`f1` IN ( SELECT `t2`.`f2` FROM `t2` WHERE `t2`.`f3` IN ( SELECT `t3`.`f4` FROM `t3` WHERE `t3`.`f5` = ? ) )
  values, // [1]
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

/* TOTAL */
var {
  sql, // SELECT COUNT(*) AS total FROM `t1` LEFT JOIN `t2` ON `t1`.`f1` = `t2`.`f2` WHERE `t1`.`f1` = ?
  values, // [1]
} = mysql.total('t1', {
  joins: {
    t2: ['f1', 'f2'],
  },
  wheres: {
    f1: 1,
  },
});

/* INSERT */ 
var {
  sql, // INSERT INTO `t1` (`t1`.`f1`, `t1`.`f2`) VALUES (?, ?)
  values, // [1, 2]
} = mysql.insert('t1', {
  f1: 1,
  f2: 2,
});

/* UPDATE */ 
var {
  sql, // UPDATE `t1` SET `t1`.`f1` = ?, `t1`.`f2` = ? WHERE `t1`.`f3` = ?
  values, // [1, 2, 3]
} = mysql.update('t1', {
  f1: 1,
  f2: 2,
}, {
  f3: 3,
});

/* DELETE */ 
var {
  sql, // DELETE FROM `t1` WHERE `t1`.`f1` = ?
  values, // [1]
} = mysql.delete('t1', {
  f1: 1,
});
```
