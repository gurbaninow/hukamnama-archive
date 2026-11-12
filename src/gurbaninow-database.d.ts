// The database package ships JavaScript only. Declare the methods and fields used by the archive.
declare module '@gurbaninow/database' {
  interface LineMatch {
    shabadId: string
    sttmId: number | null
    orderId: number
  }

  interface LineQuery {
    join(table: string, leftColumn: string, rightColumn: string): this
    whereIn(column: string, values: number[]): this
    andWhere(column: string, value: number): this
    clone(): this
    genericSearch(
      search: string,
      field: string,
      orderResults: boolean,
      anywhere: boolean,
      heavyMatching: boolean,
    ): PromiseLike<LineMatch[]>
  }

  interface ShabadQuery extends PromiseLike<{ id: string }[]> {
    select(column: 'id'): this
    whereIn(column: 'sttm_id', values: number[]): this
    orderBy(column: 'order_id'): this
  }

  export const Lines: { query(): LineQuery }
  export const Shabads: { query(): ShabadQuery }
  export const knex: { destroy(): Promise<void> }
}
