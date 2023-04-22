/**
 * SeaTable Metadata Library
 *
 *
 * {@see Metadata}
 *   {@see MetadataTable} / {@see MetadataTables}
 *   {@see MetadataTableColumn} / {@see MetadataTableColumns}
 *   {@see MetadataTableView} / {@see MetadataTableViews}
 *
 * implementation:
 *     public constructors getting their parent entity object and their raw metadata object.
 *     public parent property for hierarchy (getter).
 *     overload public properties in ctor for entity objects
 *        - up until the leaf-entity in hierarchy above
 *        - implementation of those depending on requirement/use
 *     collections have their items overloaded (they are arrays, no need to re-invent the wheel).
 */

const {sidParse} = require('../lib/sid');
const {struct} = require('../ctx');

/**
 * Metadata node
 */
class MetadataNode {
  /**
   * @type Metadata
   */
  #metadata;

  /**
   * @param {?MetadataNode} metadata
   */
  constructor(metadata = undefined) {
    metadata = metadata || this;
    if (!metadata instanceof MetadataNode) {
      throw new Error('TypeError: not a MetadataNode');
    }
    this.#metadata = metadata.#metadata;
    if (!this.#metadata && this instanceof Metadata) {
      this.#metadata = /** @type Metadata */ this;
    }
    if (!this.#metadata) {
      const error = new Error('metadata creation: no metadata');
      error.name = 'HierarchyRequestError';
      throw error;
    }
  }

  /**
   * @return {Metadata}
   */
  get metadata() {
    return this.#metadata;
  }
}

/**
 * Metadata entity (Metadata: Table, Column, View, ...)
 */
class MetadataEntity extends MetadataNode {
  /**
   * @type ?boolean parent already assigned?
   */
  #assigned;
  /**
   * @type ?MetadataEntity
   */
  parent;

  /**
   *
   * @param {Metadata|MetadataTable} entity
   * @param {Array<DTableTable|DTableColumn|DTableView>} children
   * @return {undefined}
   */
  static createCollection(entity, children) {
    return MetadataCollection.create(this, entity, children);
  }

  /**
   * NOTE: must be called *after* Object.assign(this, ...)
   *
   * @param {MetadataEntity} parent
   */
  assignParent(parent) {
    if (this.metadata !== this && parent.metadata !== this.metadata) {
      // you can not assign a parent to the entity from a different metadata
      const error = new Error('assigning parent: parent metadata mismatch');
      error.name = 'HierarchyRequestError';
      throw error;
    }

    if ((this.parent !== parent) && (this.parent || this.#assigned)) {
      // you can not assign a parent if the parent has been already assigned
      // and is a different one.
      // this can happen during testing, resolution then is to test again.
      // we may need to turn this into an update operation in case this happens
      // more often (we only see it in _stale_ Zap draft test steps that recover
      // automatically when they get traction).
      const error = new Error('assigning parent: parent already assigned');
      error.name = 'HierarchyRequestError';
      throw error;
    }

    this.#assigned = true;
    this.parent = parent;
  }

  /**
   * prevent circular references on ['parent'] elements
   *
   * this allows to use Metadata within the bundle (at bundle.dtable.metadata)
   * and for JSON.stringify() in general.
   *
   * @param {?string} key
   * @return {MetadataEntity|undefined}
   */
  toJSON(key) {
    if (key === 'parent') {
      return undefined;
    }
    return this;
  }
}

/**
 * MetadataCollection
 *
 * @template T {MetadataTable|MetadataTableView|MetadataTableColumn}
 * @typedef {Array<T>} MetadataCollection
 */
class MetadataCollection extends Array {
  #typeName;
  #idKeyField;

  /** @type {?MetadataEntity} */ #metadata;
  /** @type {?MetadataEntity} */ #parent;

  /**
   * @template T
   * @param {T|MetadataTable|MetadataTableColumn|MetadataTableView} Type
   * @param {Metadata|MetadataTable|MetadataEntity} parent
   * @param {Array<DTableTable|DTableColumn|DTableView>} entities
   * @return {MetadataCollection<T>}
   */
  static create(Type, parent, entities) {
    let typeName;
    let idKeyField;
    let CollectionType;
    switch (Type) {
      case MetadataTable:
        typeName = 'table';
        idKeyField = '_id';
        CollectionType = MetadataTables;
        break;
      case MetadataTableColumn:
        typeName = 'column';
        idKeyField = 'key';
        CollectionType = MetadataTableColumns;
        break;
      case MetadataTableView:
        typeName = 'view';
        idKeyField = '_id';
        CollectionType = MetadataTableViews;
        break;
      default:
        throw new Error('TypeError: not a MetadataCollection type');
    }
    const collection = new CollectionType(typeName, idKeyField, parent);
    if (!(collection instanceof MetadataCollection)) {
      throw new Error('TypeError: not a MetadataCollection');
    }
    if (collection.length) {
      throw new Error(`TypeError: unexpected length of ${CollectionType}, constructor or parent missing?`);
    }
    if (!entities && entities?.length !== 0) {
      throw new Error(`TypeError: entities missing for ${CollectionType}`);
    }

    collection.push(...entities.map((entity) => new Type(parent, entity)));

    return collection;
  }

  /**
   * @param {'table'|'column'|'view'} typeName
   * @param {'_id'|'key'} idKeyField
   * @param {?MetadataEntity} parent
   */
  constructor(typeName, idKeyField, parent) {
    super();
    this.#typeName = typeName;
    this.#idKeyField = idKeyField;
    this.#metadata = parent?.metadata || parent;
    this.#parent = parent;
  }

  /**
   * @return {?MetadataEntity}
   */
  get parent() {
    return this.#parent;
  }

  /**
   * select a T by sid or T.[#idKeyField]
   *
   * @param {string|SidObj} sidOrIdKey
   * @return {MetadataTable|MetadataTableView|MetadataTableColumn}
   */
  select(sidOrIdKey) {
    const idKey = sidParse(sidOrIdKey, {})?.[this.#typeName] || sidOrIdKey;
    return idKey && this.find((t) => t[this.#idKeyField] === idKey);
  }

  /**
   * @param {string|SidObj} sidOrIdKey
   * @return {string}
   */
  name(sidOrIdKey) {
    return this.select(sidOrIdKey)?.name;
  }
}

/**
 * Metadata class
 *
 * represents the metadata of a base/app "dtable"
 *
 * {@see {DTableMetadataTables}} + methods
 *
 * @property {MetadataTables} tables
 * @property {number} version = 3634
 * @property {number} format_version = 9
 * @property {DTableMetadataSettings} settings
 */
class Metadata extends MetadataEntity {
  /**
   * @param {DTableMetadataTables} metadata
   */
  constructor(metadata) {
    super();
    Object.assign(this, metadata);
    this.assignParent(null);

    this.tables = /** @type MetadataTables*/ MetadataTable.createCollection(this, this.tables);
  }

  /**
   * @param {string|SidObj} sidOrColumnKey
   * @param {?string} tableID
   * @return {string}
   */
  columnName(sidOrColumnKey, tableID = null) {
    return this.findColumn(sidOrColumnKey, tableID)?.name;
  }

  /**
   * get table-name from sid or key
   *
   * @param {string} sidOrTableId
   * @return {string|undefined}
   */
  tableName(sidOrTableId) {
    return this.tables.name(sidOrTableId);
  }

  /**
   * find column from sid or column.key
   *
   * @param {string} sidOrColumnKey
   * @param {?string} tableId optional table-id if reference is for column only (e.g. <key> or Sid(column:<key>) )
   * @return {MetadataTableColumn|undefined}
   */
  findColumn(sidOrColumnKey, tableId = null) {
    const table = /** @type MetadataTable */ this.tables.select(tableId || sidOrColumnKey);
    if (table) {
      const columnKey = sidParse(sidOrColumnKey, {})?.column || sidOrColumnKey;
      return /** @type MetadataTableColumn|undefined */ table.columns.find((c) => c.key === columnKey);
    }
    if (tableId) {
      throw new ReferenceError(`find column: unknown table for ${(tableId || sidOrColumnKey)}`);
    }
  }

  /**
   * find all columns by one or more column types (across all tables)
   *
   * @param {string} type
   * @return {Array<{column: MetadataTableColumn, table: MetadataTable, sid: string}>}
   */
  findColumnsByType(...type) {
    const tableColumns = [];
    for (const [sid, [table, column]] of this.columnEntries()) {
      if (type.includes(column.type)) {
        tableColumns.push({column, table, sid});
      }
    }

    return tableColumns;
  }

  /**
   * FIXME: TODO: metadata itself can have all columns now, as columns have their parent table
   *        NOTE: this does not "sid" it yet.
   *
   * @return {Array<[string, [MetadataTable, MetadataTableColumn]]>}
   */
  columnEntries() {
    const entries = [];
    for (const table of this.tables) {
      for (const column of table.columns) {
        entries.push(
            [`table:${table._id}:column:${column.key}`, [table, column]],
        );
      }
    }
    return entries;
  }
}

/**
 * @class MetadataTable
 * @extends DTableTable
 * @property {MetadataTableColumns} columns
 * @property {MetadataTableViews} views
 */
class MetadataTable extends MetadataEntity {
  /**
   * @param {Metadata} metadata
   * @param {DTableTable} tableMetadata
   */
  constructor(metadata, tableMetadata) {
    super(metadata);
    Object.assign(this, tableMetadata);
    this.assignParent(metadata);

    this.columns = /** @type MetadataTableColumns */ MetadataTableColumn.createCollection(this, this.columns);
    this.views = /** @type MetadataTableViews */ MetadataTableView.createCollection(this, this.views);
  }

  /**
   * @return {MetadataTableColumn[]}
   */
  get columnsForRowLookup() {
    return this.columns.forRowLookup;
  }
}

/**
 * MetadataTables
 *
 * @typedef {MetadataCollection<MetadataTable>} MetadataTables
 */
class MetadataTables extends MetadataCollection {
  /**
   * select a table from sid or table._id
   *
   * @param {string|SidObj} sidOrTableId
   * @return {MetadataTable}
   */
  select(sidOrTableId) {
    return super.select(sidOrTableId);
  }

  /**
   * @param {string|SidObj} sidOrTableId
   * @return {string}
   */
  name(sidOrTableId) {
    return super.name(sidOrTableId);
  }
}

/**
 * @extends DTableColumn
 */
class MetadataTableColumn extends MetadataEntity {
  /** @property {Metadata} */
  #tableMetadata;

  /**
   * @param {MetadataTable} metadata
   * @param {DTableColumn} columnMetadata
   */
  constructor(metadata, columnMetadata) {
    super(metadata);
    this.#tableMetadata = metadata;
    Object.assign(this, columnMetadata);
    this.assignParent(metadata);
  }
}

/**
 * @class MetadataTableColumns
 *
 * @typedef {MetadataCollection<MetadataTableColumn>} MetadataTableColumns
 *
 */
class MetadataTableColumns extends MetadataCollection {
  /**
   * select a column from sid or column.key
   *
   * @param {string|SidObj} sidOrColumnKey
   * @return {MetadataTableColumn}
   */
  select(sidOrColumnKey) {
    return super.select(sidOrColumnKey);
  }

  /**
   * @param {string|SidObj} sidOrColumnKey
   * @return {string}
   */
  name(sidOrColumnKey) {
    return super.name(sidOrColumnKey);
  }

  /**
   * @return {MetadataTableColumn[]}
   */
  get forRowLookup() {
    return this.filter((column) =>
      struct.columns.zapier.row_lookup.includes(column.type));
  }
}

/**
 * @extends DTableView
 */
class MetadataTableView extends MetadataEntity {
  /**
   * @param {MetadataTable} tableMetadata
   * @param {DTableView} viewMetadata
   */
  constructor(tableMetadata, viewMetadata) {
    super(tableMetadata);
    Object.assign(this, viewMetadata);
    this.assignParent(tableMetadata);
  }
}

/**
 * MetadataTables
 *
 * @typedef {MetadataCollection<MetadataTableView>} MetadataTableViews
 */
class MetadataTableViews extends MetadataCollection {
  /**
   * select a view by sid or view._id
   *
   * @param {string|SidObj} sidOrViewId
   * @return {MetadataTableView}
   */
  select(sidOrViewId) {
    return super.select(sidOrViewId);
  }

  /**
   * @param {string|SidObj} sidOrViewId
   * @return {string}
   */
  name(sidOrViewId) {
    return super.name(sidOrViewId);
  }
}

module.exports = {
  Metadata,
  MetadataNode,
  MetadataTable,
  MetadataTables,
  MetadataTableColumn,
  MetadataTableColumns,
  MetadataTableView,
  MetadataTableViews,
};
