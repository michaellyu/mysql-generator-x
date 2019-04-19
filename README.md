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
  sql, // SELECT * FROM `t1` WHERE `t1`.`f1` = ? AND `t1`.`f2` > ? OR ( `t1`.`f3` IN (?) )
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
  values, // [1, 2, [3, 4, 5]]
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

/* CREATE */ 
var {
  sql, // INSERT INTO `t1` (`t1`.`f1`, `t1`.`f2`) VALUES (?, ?)
  values, // [1, 2]
} = mysql.create('t1', {
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
