// handles the underlying logic of CRUD operations with queries

import { forin, isEmptyObject, isObject } from './helpers';
import { KeyValue } from './types';

/**
 * TOP LEVEL OPS
 * and
 * not
 * nor
 * or
 *
 * CHILD OPS ( on a field )
 * eq
 * gt
 * gtw
 * in
 * lt
 * lte
 * ne
 * nin
 * exists
 * type
 * all
 * elemMatch
 * size
 * (maybe)
 *  bitsAllClear
 *  bitsAllSet
 *  bitsAnyClear
 *  bitsAnySet
 */

// TODO deterine how to index arrays and objects
/**
 * most likey solution for indexing objects is to only allow indexing of a field inside of it
 *  for example
 *  {
 *      obj: {
 *          a: 1
 *          b: "str"
 *      }
 *  }
 *  document.obj.a can be indexed but document.obj cant as its not a basic data type
 *  indexing a whole object could work by indexing each child field and then using these to find
 *
 * for arrays easy to allow indexing of basic types but problem with child arrays and objects
 */

type IndexPositions = KeyValue<number[]>

type Value = string | number | KeyValue<unknown> | unknown[] | boolean;

type RowInput = KeyValue<Value>

const serializeKey = (value: Value): string => typeof value + JSON.stringify(value);

const isOperation = (key: string): boolean => key.startsWith('$');

class Index {
	indexes: IndexPositions = {};

	fieldName: string;

	constructor(fieldName: string) {
		this.fieldName = fieldName;
		this.indexes = {};
	}

	// Get based on a value or returns null
	get(value: Value): number[] | null {
		return this.indexes[serializeKey(value)] || null;
	}

	getAll(): IndexPositions {
		return this.indexes;
	}

	// Add a value to index
	add(position: number, value: Value): void {
		const currData = this.get(value);
		if (currData) {
			currData.push(position);
		} else {
			this.indexes[serializeKey(value)] = [position];
		}
	}

	update(position: number, oldValue: Value, newValue: Value): void {
		// check if index actually exists
		const currData = this.get(oldValue);
		if (currData) {
			this.delete(position, oldValue);
			this.add(position, newValue);
		}
	}

	delete(position: number, value: Value): void {
		const currData = this.get(value);
		if (currData) {
			const positionLoc = currData.indexOf(position);
			if (positionLoc > -1) {
				// remove it from the array
				currData.splice(positionLoc, 1);
			}
		}
	}

	// TODO is this a RowInput or Row
	build(data: Array<RowInput | null>): void {
		for (let i = 0; i < data.length; i++) {
			const row = data[i];
			if (row) {
				this.add(i, row[this.fieldName]);
			}
		}
	}
}

type Operation = {
    data: any[]
    value: any
    type: 'field'
    field: string
} | {
    data: any[]
    value: any
    type: 'root'
}

type UniqueId = number;

type Row = {
	[key: string]: Value,
	_id: UniqueId
}

type Query = KeyValue<Value | Operation>

class Table {
	data: Array<Row | null>;

	index: UniqueId;

	indexes: {
        [key: string]: Index
    };

	// keeps track of rows without any data
	empty: number[];

	constructor(options?: {data?: Row[], indexes?: string[]}) {
		this.index = 1;

		this.data = options?.data ? [...this.build(options.data)] : [];

		this.indexes = {
			_id: new Index('_id'),
		};
		// create indexes for provided fields
		options?.indexes?.forEach((keyName) => {
			this.indexes[keyName] = new Index(keyName);
		});

		this.indexes._id.build(this.data || []);
		this.empty = [];
	}

	operators: KeyValue<(/** op: Operation */) => number[]> = {
		// eq: (op: Operation) => {
		// 	if (op.type === 'root') throw Error();

		// 	if (this.indexes[op.field]) {
		// 		const found = this.indexes[op.field][op.value];
		// 		if (!found) return null;
		// 		else if (typeof found === 'number') {
		// 			return [found];
		// 		} else {
		// 			return found;
		// 		}
		// 	}
		// }
	};

	/**
     * Creates a unique identifier
     */
	generateId(): UniqueId {
		return this.index++;
	}

	/**
     * return the locations of the rows so you can do whatever with them
     */
	executeQuery(query: Query): number[] {
		let indexes: number[] = [];
		let firstCycle = true;

		// handle empty
		if (isEmptyObject(query)) {
			// return all positions without the deleted ones
			for (let i = 0; i < this.data.length; i++) {
				if (this.empty.indexOf(i) === -1) {
					indexes.push(i);
				}
			}
		}

		forin(query, (key) => {
			const value = query[key];
			// console.log({key, value})
			// console.log('is operator: ', isOperation(key))

			// Check if key is operator
			if (isOperation(key)) {
				// TODO add this
				if (!this.operators[key]) throw Error();
				// const result = this.operators[key]({
				// 	data: this.data,
				// 	key,
				// 	type: 'root',
				// 	value: value,
				// });
			} else if (isObject(value)) {
				// if the value is an object will mean uses operators
			} else {
				// find rows where key field equals value
				// check if field indexed
				if (this.isIndexed(key)) {
					const index = this.indexes[key];
					// DPrint(`key ${key} is indexed`)
					const positionsFound = index.get(value) || [];
					if (firstCycle) {
						indexes = positionsFound;
					} else {
						// get intersect of indexes and positionsFound
						// TODO how can this be more efficient
						const tempIndexes: number[] = [];
						positionsFound.forEach((position) => {
							if (indexes.indexOf(position) > -1) {
								tempIndexes.push(position);
							}
						});
						indexes = tempIndexes;
					}
				} else if (firstCycle) {
					// have to search all data
					const positionsFound: number[] = [];
					this.data.forEach((row, index) => {
						if (row && row[key] === value) {
							positionsFound.push(index);
						}
					});
					indexes = positionsFound;
				} else {
					// look based on what found so far
					const tempIndexes: number[] = [];
					indexes.forEach((position) => {
						const row = this.data[position];
						if (row && row[key] === value) {
							tempIndexes.push(position);
						}
					});
					indexes = tempIndexes;
				}
			}
			firstCycle = false;
		});
		return indexes;
	}

	create(data: RowInput): Row {
		// this could be substituted for a ObjectId like in mongo
		const rowIndex = this.index++;
		// Determine where it will be
		let rowPosition;
		const cleanedData = { ...data, _id: rowIndex };

		rowPosition = this.empty.pop();
		if (rowPosition === undefined) {
			rowPosition = this.data.length;
		}

		this.data[rowPosition] = cleanedData;
		// console.log(this.data)
		this.addIndexesForRow(cleanedData, rowPosition);
		return cleanedData;
	}

	find(query: Query): Row[] {
		const positions = this.executeQuery(query);
		const loaded: Row[] = [];
		positions.forEach((position) => {
			const row = this.data[position];
			if (row !== null) {
				loaded.push(row);
			} else {
				console.log(`No data for row at position ${position}`);
			}
		});
		return loaded;
	}

	delete(query: Query): { success: boolean, deletedCount: number } {
		const positions = this.executeQuery(query);
		positions.forEach((position) => {
			const row = this.data[position];
			this.data[position] = null;
			this.empty.push(position);
			if (row !== null) {
				forin(this.indexes, (key) => {
					const index = this.indexes[key];
					index.delete(position, row[key]);
				});
			}
		});
		return {
			success: true,
			deletedCount: positions.length,
		};
	}

	update(query: Query, set: KeyValue<Value>): {
		success: boolean,
		updated: number,
		failed: number
	} {
		const positions = this.executeQuery(query);
		let errors = 0;
		// locations that matched the query
		positions.forEach((position) => {
			const row = this.data[position];
			if (row) {
				// dont allow _id to be modified
				this.data[position] = { ...this.data[position], ...set, _id: row._id };

				// update indexes
				forin(set, (key) => {
					if (this.isIndexed(key)) {
						const value = set[key];
						this.indexes[key].update(position, row[key], value);
					}
				});
			} else {
				errors++;
			}
		});
		return {
			success: true,
			updated: (positions.length) - errors,
			failed: errors,
		};
	}

	addIndex(field: string): void {
		this.indexes[field] = new Index(field);
		// have to build index with current data
		this.indexes[field].build(this.data);
	}

	removeIndex(field: string): void {
		delete this.indexes[field];
	}

	/**
     * Adds the indexes for a row on its creation
     */
	addIndexesForRow(row: RowInput, position: number): void {
		forin(row, (key) => {
			const value = row[key];
			if (this.isIndexed(key)) {
				const index = this.indexes[key];
				index.add(position, value);
			}
		});
	}

	isIndexed(key: string): boolean {
		return !!this.indexes[key];
	}

	build(data: Array<RowInput>): Row[] {
		const formatted: Row[] = [];
		data.forEach((row) => {
			if (row._id) {
				// ensure no duplicates
				throw new Error('Cant provide custom _id');
			} else {
				formatted.push({ ...row, _id: this.generateId() } as Row);
			}
		});
		return formatted;
	}
}

export default Table;
