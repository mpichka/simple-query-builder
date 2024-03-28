import { SimpleQueryBuilder } from "./SimpleQueryBuilder";

describe("SimpleQueryBuilder", () => {
  it("should throw error if no params was provided", () => {
    const builder = new SimpleQueryBuilder();

    expect(() => builder.build()).toThrow();
  });

  describe("Simple select", () => {
    it("Select user with id = 42", () => {
      expect.assertions(2);

      const builder = new SimpleQueryBuilder();

      const [query, params] = builder
        .addSelect('"id", "name", "email"')
        .setFrom('"users"')
        .addWhere('"id" = :id')
        .addParameters({ id: 42 })
        .build();

      expect(query).toBe(
        'SELECT "id", "name", "email" FROM "users" WHERE "id" = $1;'
      );
      expect(params).toEqual([42]);
    });
  });

  describe("Union select", () => {
    it("Should query sellers and customers in a single table with params", () => {
      expect.assertions(2);

      const sellersBuilder = new SimpleQueryBuilder();
      const customersBuilder = new SimpleQueryBuilder();

      const sellersQuery = sellersBuilder
        .addSelect('"id", "name"')
        .addWhere('"id" > :id')
        .setFrom('"sellers"').query;

      const customersQuery = customersBuilder
        .addSelect('"id", "name"')
        .setFrom('"customers"').query;

      const [query, params] = new SimpleQueryBuilder()
        .addUnion(SimpleQueryBuilder.makeSubQuery(sellersQuery))
        .addUnion(SimpleQueryBuilder.makeSubQuery(customersQuery))
        .addWhere('"name" = :name')
        .addParameters({ id: 42, name: "John" })
        .build();

      expect(query).toBe(
        '(SELECT "id", "name" FROM "sellers" WHERE "id" > $1) UNION ALL (SELECT "id", "name" FROM "customers") WHERE "name" = $2;'
      );
      expect(params).toEqual([42, "John"]);
    });
  });

  describe("Joins", () => {
    it("Should inner join pets with owners", () => {
      expect.assertions(2);

      const userBuilder = new SimpleQueryBuilder();

      const userFields = `
        "users"."id" AS "users.id",
        "users"."name" AS "users.name",
        "users"."email" AS "users.email"
      `;

      const petFields = `
        "pets"."name" AS "pets.name"
      `;

      const [query, params] = userBuilder
        .addSelect(userFields)
        .addSelect(petFields)
        .setFrom('"users"')
        .addJoin('INNER JOIN "pets" ON "pets"."ownerId" = "users"."id"')
        .build();

      expect(query).toBe(
        'SELECT "users"."id" AS "users.id", "users"."name" AS "users.name", "users"."email" AS "users.email", "pets"."name" AS "pets.name" FROM "users" INNER JOIN "pets" ON "pets"."ownerId" = "users"."id";'
      );
      expect(params).toEqual([]);
    });

    it("Should left join users with companies", () => {
      expect.assertions(2);

      const userBuilder = new SimpleQueryBuilder();

      const userFields = `
        "users"."id" AS "users.id",
        "users"."name" AS "users.name",
        "users"."email" AS "users.email"
      `;

      const companyFields = `
        "companies"."name" AS "companies.name",
        "companies"."address" AS "companies.address"
      `;

      const [query, params] = userBuilder
        .addSelect(userFields)
        .addSelect(companyFields)
        .setFrom('"users"')
        .addJoin(
          'LEFT OUTER JOIN "companies" ON "companies"."id" = "users"."companyId"'
        )
        .build();

      expect(query).toBe(
        'SELECT "users"."id" AS "users.id", "users"."name" AS "users.name", "users"."email" AS "users.email", "companies"."name" AS "companies.name", "companies"."address" AS "companies.address" FROM "users" LEFT OUTER JOIN "companies" ON "companies"."id" = "users"."companyId";'
      );
      expect(params).toEqual([]);
    });

    it("Should join user with goods through orders", () => {
      expect.assertions(2);

      const userBuilder = new SimpleQueryBuilder();

      const userFields = `
        "users"."id" AS "users.id",
        "users"."name" AS "users.name",
        "users"."email" AS "users.email"
      `;

      const goodsFields = `
        "goods"."name" AS "goods.name",
        "goods"."price" AS "goods.price"        
      `;

      const [query, params] = userBuilder
        .addSelect(userFields)
        .addSelect(goodsFields)
        .setFrom('"users"')
        .addJoin('INNER JOIN "orders" ON "orders"."userId" = "users"."id"')
        .addJoin('INNER JOIN "goods" ON "goods"."id" = "orders"."goodId"')
        .build();

      expect(query).toBe(
        'SELECT "users"."id" AS "users.id", "users"."name" AS "users.name", "users"."email" AS "users.email", "goods"."name" AS "goods.name", "goods"."price" AS "goods.price" FROM "users" INNER JOIN "orders" ON "orders"."userId" = "users"."id" INNER JOIN "goods" ON "goods"."id" = "orders"."goodId";'
      );
      expect(params).toEqual([]);
    });
  });

  describe("Groups", () => {
    it("Should group users by role", () => {
      expect.assertions(2);

      const userBuilder = new SimpleQueryBuilder();

      const userFields = `
        "users"."id" AS "users.id",
        "users"."name" AS "users.name",
        "users"."role" AS "users.role"
      `;

      const [query, params] = userBuilder
        .addSelect(userFields)
        .setFrom('"users"')
        .addGroup('"users"."role"')
        .build();

      expect(query).toBe(
        'SELECT "users"."id" AS "users.id", "users"."name" AS "users.name", "users"."role" AS "users.role" FROM "users" GROUP BY "users"."role";'
      );
      expect(params).toEqual([]);
    });
  });

  describe("Where conditions", () => {
    it("Should select users with name = John", () => {
      expect.assertions(2);

      const userBuilder = new SimpleQueryBuilder();

      const userFields = `
        "users"."id" AS "users.id",
        "users"."name" AS "users.name",
        "users"."email" AS "users.email"
      `;

      const [query, params] = userBuilder
        .addSelect(userFields)
        .setFrom('"users"')
        .addWhere('"users"."name" = :name')
        .addParameters({ name: "John" })
        .build();

      expect(query).toBe(
        'SELECT "users"."id" AS "users.id", "users"."name" AS "users.name", "users"."email" AS "users.email" FROM "users" WHERE "users"."name" = $1;'
      );
      expect(params).toEqual(["John"]);
    });

    it("Should select users with email domain gmail or hotmail and age larger 35", () => {
      expect.assertions(2);

      const userBuilder = new SimpleQueryBuilder();

      const userFields = `
        "users"."id" AS "users.id",
        "users"."name" AS "users.name",
        "users"."email" AS "users.email",
        "users"."age" AS "users.age"
      `;

      const [query, params] = userBuilder
        .addSelect(userFields)
        .setFrom('"users"')
        .addWhere(
          SimpleQueryBuilder.makeSubQuery(
            `"users"."email" LIKE '%gmail.com' OR "users"."email" LIKE '%hotmail.com'`
          )
        )
        .addWhere(`"users"."age" > :age`)
        .addParameters({ age: 35 })
        .build();

      expect(query).toBe(
        'SELECT "users"."id" AS "users.id", "users"."name" AS "users.name", "users"."email" AS "users.email", "users"."age" AS "users.age" FROM "users" WHERE ("users"."email" LIKE \'%gmail.com\' OR "users"."email" LIKE \'%hotmail.com\') AND "users"."age" > $1;'
      );
      expect(params).toEqual([35]);
    });
  });

  describe("Having conditions", () => {
    it.todo("Should filter by aggregated function");
  });

  describe("Pagination", () => {
    it("Should select 25 pets", () => {
      expect.assertions(2);

      const petBuilder = new SimpleQueryBuilder();

      const [query, params] = petBuilder
        .addSelect('"id", "name"')
        .setFrom('"pets"')
        .setPagination("LIMIT :limit")
        .addParameters({ limit: 100 })
        .build();

      expect(query).toBe('SELECT "id", "name" FROM "pets" LIMIT $1;');
      expect(params).toEqual([100]);
    });

    it("Should select 100 toys after 200 items", () => {
      expect.assertions(2);

      const toyBuilder = new SimpleQueryBuilder();

      const [query, params] = toyBuilder
        .addSelect('"id", "name"')
        .setFrom('"toys"')
        .setPagination()
        .addParameters({ limit: 100, offset: 200 })
        .build();

      expect(query).toBe('SELECT "id", "name" FROM "toys" LIMIT $1 OFFSET $2;');
      expect(params).toEqual([100, 200]);
    });

    it("Should select 50 users and order them by name", () => {
      expect.assertions(2);

      const userBuilder = new SimpleQueryBuilder();

      const [query, params] = userBuilder
        .addSelect('"id", "name"')
        .setFrom('"users"')
        .setPagination()
        .addOrder('"name" ASC')
        .addParameters({ limit: 50, offset: 0 })
        .build();

      expect(query).toBe(
        'SELECT "id", "name" FROM "users" ORDER BY "name" ASC LIMIT $1 OFFSET $2;'
      );
      expect(params).toEqual([50, 0]);
    });
  });
});
