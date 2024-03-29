export class SimpleQueryBuilder {
  private from: string;
  private unions: string[];
  private selects: string[];
  private joins: string[];
  private wheres: string[];
  private orders: string[];
  private groups: string[];
  private havings: string[];
  private pagination: string;
  private parameters: Map<string, any>;

  constructor() {
    this.from = "";
    this.unions = [];
    this.selects = [];
    this.joins = [];
    this.wheres = [];
    this.orders = [];
    this.groups = [];
    this.havings = [];
    this.pagination = "";
    this.parameters = new Map();
  }

  public addUnion(value: string) {
    this.unions.push(value);
    return this;
  }

  public addSelect(value: string) {
    this.selects.push(value);
    return this;
  }

  public setFrom(value: string) {
    this.from = value;
    return this;
  }

  public addJoin(value: string) {
    this.joins.push(value);
    return this;
  }

  public addWhere(value: string) {
    this.wheres.push(value);
    return this;
  }

  public addGroup(value: string) {
    this.groups.push(value);
    return this;
  }

  public addOrder(value: string) {
    this.orders.push(value);
    return this;
  }

  public setPagination(value?: string) {
    this.pagination = value || "LIMIT :limit OFFSET :offset";
    return this;
  }

  public addHaving(value: string) {
    this.havings.push(value);
    return this;
  }

  public addParameters(params: Record<string, any>) {
    for (const [key, value] of Object.entries(params)) {
      this.parameters.set(key, value);
    }
    return this;
  }

  public get query() {
    let selectParams = "";
    let joinParams = "";
    let whereParams = "";
    let orderParams = "";
    let groupParams = "";
    let havingParams = "";

    if (this.selects.length) {
      if (this.selects.length > 1) {
        selectParams = this.selects
          .map((s) => s.split(",").map((v) => v.trim()))
          .flat()
          .join(", ");
      } else {
        selectParams = this.selects[0];
      }
    }

    if (this.joins.length) {
      joinParams = this.joins.join(" ");
    }

    if (this.wheres.length) {
      whereParams = `WHERE ${this.wheres.join(" AND ")} `;
    }

    if (this.orders.length) {
      orderParams = `ORDER BY ${this.orders.join(", ")}`;
    }

    if (this.groups.length) {
      groupParams = `GROUP BY ${this.groups.join(", ")}`;
    }

    if (this.havings.length) {
      havingParams = `HAVING ${this.havings.join(" AND ")}`;
    }

    let sql = "";

    if (!this.unions.length && !this.selects.length) {
      throw new Error("Empty select statement");
    }

    if (this.unions.length) {
      sql += this.unions.join(" UNION ALL ");
    } else {
      sql += `SELECT ${selectParams.length ? selectParams : "*"}\n`;

      if (this.from) {
        sql += `FROM ${this.from}\n`;
      }
    }

    sql += `
      ${joinParams}
      ${whereParams}
      ${groupParams}
      ${havingParams}
      ${orderParams}
      ${this.pagination}
    `;

    return sql.replace(/\s+/gi, " ").trim();
  }

  public build(): [string, any[]] {
    let parameterCount = 0;
    let parameterizedQuery = this.query;
    const parameters = [];

    if (this.parameters.size) {
      for (const [key, value] of this.parameters.entries()) {
        parameterizedQuery = parameterizedQuery.replaceAll(
          `:${key}`,
          `$${++parameterCount}`
        );
        parameters.push(value);
      }
    }

    parameterizedQuery += ";";

    return [parameterizedQuery, parameters];
  }

  public static makeSubQuery(query: string) {
    return `(${query})`;
  }
}
