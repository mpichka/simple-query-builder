# Simple Query Builder

Tired of learning new syntax of modern ORMs? I'm here to help you!

Simple Query Builder is a unique language and orm agnostic builder that will cover you on that rare usecase when traditional query builders sucks the most!

### Basic Usage

```typescript
import { SimpleQueryBuilder } from "./SimpleQueryBuilder";

const builder = new SimpleQueryBuilder();

const [query, params] = builder
  .addSelect('"id", "name", "email"')
  .setFrom('"users"')
  .addWhere('"id" = :id')
  .addParameters({ id: 42 })
  .build();

// query -> SELECT "id", "name", "email" FROM "users" WHERE "id" = $1;
//                                                                  ^
//                  Notice that replacements will be changing to bindings
// params -> [42]
//            ^
//          TypeORM compatible bindings list
```

### Using with TypeORM

```typescript
import { SimpleQueryBuilder } from "./SimpleQueryBuilder";

const sellersBuilder = new SimpleQueryBuilder();
const customersBuilder = new SimpleQueryBuilder();

const sellersQuery = sellersBuilder
  .addSelect('"id", "name", "created_at"')
  .addWhere('"created_at" >= :date')
  .setFrom('"sellers"').query;

const customersQuery = customersBuilder
  .addSelect('"id", "name", "created_at"')
  .setFrom('"customers"').query;

const [query, params] = new SimpleQueryBuilder()
  .addUnion(SimpleQueryBuilder.makeSubQuery(sellersQuery))
  .addUnion(SimpleQueryBuilder.makeSubQuery(customersQuery))
  .addWhere('"name" = :name')
  .setPagination()
  .addParameters({
    name: "John",
    date: new Date().toISOString(),
    limit: 20,
    offset: 0,
  })
  .build();

// query -> (SELECT "id", "name", "created_at" FROM "sellers" WHERE "created_at" >= $2) UNION ALL (SELECT "id", "name" FROM "customers") WHERE "name" = $1 LIMIT $3 OFFSET $4;

const res = await dataSource.query(query, params);
// ^ raw response
```

### API

| method          | arguments             | returns              | description                                                                                                                                                                                                         |
| --------------- | --------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addSelect`     | `string`              | `SimpleQueryBuilder` | Add a new select statements to the list of selected fields. Comma separated.                                                                                                                                        |
| `setFrom`       | `string`              | `SimpleQueryBuilder` | Define the table to which the query will be addressed. Calling again will overwrite the table name                                                                                                                  |
| `addUnion`      | `string`              | `SimpleQueryBuilder` | Alternative to `addSelect` and `setFrom` methods, you can specify subquery for union joins                                                                                                                          |
| `makeSubQuery`  | `string`              | `SimpleQueryBuilder` | Static helper method for making subqueries. Basically it will add parentheses around query statement.                                                                                                               |
| `addJoin`       | `string`              | `SimpleQueryBuilder` | Add a new join statement to the list of joins. The order in which joins are called matters.                                                                                                                         |
| `addWhere`      | `string`              | `SimpleQueryBuilder` | Add a new where statement to the list of wheres. Calling again will add next statement with `AND` conjunction. If you need `OR` conjunction specify it directly. `addWhere('(id = 42 OR name = :name)')`            |
| `addHaving`     | `string`              | `SimpleQueryBuilder` | Add a new having statement to the list of havings. Calling again will add next statement with `AND` conjunction. If you need `OR` conjunction specify it directly. `addHaving('(count >= 42 OR status = :status)')` |
| `addGroup`      | `string`              | `SimpleQueryBuilder` | Add a new group column to the list of group columns.                                                                                                                                                                |
| `addOrder`      | `string`              | `SimpleQueryBuilder` | Add a new order field to the list of orders                                                                                                                                                                         |
| `setPagination` | _optional_ `string`   | `SimpleQueryBuilder` | Set pagination statement. By default it will insert statement `LIMIT :limit OFFSET :offset`.                                                                                                                        |
| `addParameters` | `Record<string, any>` | `SimpleQueryBuilder` | Set values for the replacements. Replacements defines as `:key` where key is a property of provided object.                                                                                                         |
| `query`         | _getter_              | `string`             | Prepared statements with replacements                                                                                                                                                                               |
| `build`         |                       | `[string, any[]]`    | Prepare query changing replacements with corresponding bindings.                                                                                                                                                    |
