// handles the underlying logic of CRUD operations with queries

import DPrint from "./DPrint"
import helpers from "./helpers"

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
class Index {
    indexes = {}
    fieldName: string
    constructor(fieldName: string) {
        this.fieldName = fieldName
        this.indexes = {}
    }

    // Get based on a value or returns null
    get(value: any): number[] | null {
        return this.indexes[value] || null;
    }

    getAll() {
        return this.indexes;
    }

    // Add a value to index
    add(position: number, value: any) {
        let currData = this.get(value);
        if (currData) {
            currData.push(position)
        } else {
            // i wish i was using rust for this
            this.indexes[value] = [position]
        }
    }
    
    
    update(position: number, oldValue: any, newValue: any) {
        let currData = this.get(oldValue);
        if (currData) {
            this.delete(position, oldValue);
            this.add(position, newValue);
        }
    }
    
    delete(position: number, value: any) {
        let currData = this.get(value);
        if (currData) {
            const positionLoc = currData.indexOf(position);
            if (positionLoc > -1) {
                // remove it from the array and add to new one
                currData.splice(positionLoc, 1);
            }
        }
    }

    build(data: any[]) {
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            this.add(i, row[this.fieldName]);
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

type Row = {
    [key: string]: any
}

class Table {
    data: Array<Row | null>
    index: number
    indexes: {
        [key: string]: Index 
    }

    // keeps track of rows without any data
    empty: number[]
    constructor (data?: Object[]) {
        this.index = 1
        this.data = data? [...this.build(data)] : [];
        this.indexes = {
            _id: new Index('_id')
        }
        this.indexes._id.build(this.data || [])
        this.empty = []
    }
    
    operators: {
        [key: string]: Function
    } = {
        eq: (op: Operation) => {
            if (op.type === 'root') throw Error()
    
            if (this.indexes[op.field]) {
                const found = this.indexes[op.field][op.value]
                if (!found) return null
                else if (typeof found === "number") {
                    return [found]
                } else {
                    return found
                }
            }
        }
    }

    generateId() {
        return this.index++
    }

    /**
     * return the locations of the rows so you can do whatever with them
     */
    executeQuery(query: any) {
        let indexes: number[] = [];
        let firstCycle = true;
        for (const key in query) {
            if (Object.prototype.hasOwnProperty.call(query, key)) {
                const value = query[key];
                console.log({key, value})
                console.log('is operator: ', this.isOperation(key))
                
                // Check if key is operator
                if (this.isOperation(key)) {
                    // TODO add this
                    if (!this.operators[key]) throw Error()
                    const result = this.operators[key]({
                        data: this.data,
                        key,
                        type: 'root',
                        value: value,
                    })
                } else if (helpers.isObject(value)) {
                    // if the value is an object will mean uses operators
                } else {
                    // find rows where key field equals value
                    // check if field indexed
                    if (this.isIndexed(key)) {
                        const index = this.indexes[key]
                        DPrint(`key ${key} is indexed`)
                        const positionsFound = index.get(value) || []
                        if (firstCycle) {
                            indexes = positionsFound;
                        } else {
                            // get intersect of indexes and positionsFound 
                            // TODO how can this be more efficient
                            const tempIndexes: number[] = [];
                            positionsFound.forEach(position => {
                                if (indexes.indexOf(position) > -1) {
                                    tempIndexes.push(position)
                                }
                            })
                            indexes = tempIndexes;
                        }
                    } else {
                        if (firstCycle) {
                            // have to search all data
                            const positionsFound: number[] = [];
                            this.data.forEach((row, index) => {
                                if (row && row[key] === value) {
                                    positionsFound.push(index)
                                }
                            });
                            indexes = positionsFound;
                        } else {
                            // look based on what found so far
                            const tempIndexes: number[] = [];
                            indexes.forEach(position => {
                                const row = this.data[position];
                                if (row && row[key] === value) {
                                    tempIndexes.push(position);
                                }
                            });
                            indexes = tempIndexes;
                        }
                        // search manually for it through every row :(
                        // when not indexed only have to search through rows already matching so can just replace the foundIndexes
                    }
                }
                firstCycle = false;
            }
        }
        return indexes
    }

    create(data: {[key: string]: any}) {
        // this could be substituted for a ObjectId like in mongo
        const rowIndex = this.index++
        // Determine where it will be
        let rowPosition
        const cleanedData = { ...data, _id: rowIndex}

        rowPosition = this.empty.pop()
        if (rowPosition === undefined) {
            rowPosition = this.data.length
        }

        this.data[rowPosition] = cleanedData
        console.log(this.data)
        this.updateIndexesForRow(cleanedData, rowPosition)
        
    }

    find(query: any) {
        const positions = this.executeQuery(query);
        const loaded: any[] = []
        positions.forEach(position => {
            loaded.push(this.data[position])
        })
        return loaded
    }

    delete(query: any): { success: boolean, deletedCount: number } {
        const positions = this.executeQuery(query);
        positions.forEach(position => {
            const row = this.data[position]
            this.data[position] = null;
            this.empty.push(position)
            if (row) {
                for (const key in this.indexes) {
                    if (Object.prototype.hasOwnProperty.call(this.indexes, key)) {
                        const index = this.indexes[key];
                        index.delete(position, row[key]);
                    }
                }
            }
        })
        return {
            success: true,
            deletedCount: positions.length+1
        }
    } 

    update(query: any, set: any) {
        const positions = this.executeQuery(query);
        let errors = 0
        positions.forEach(position => {
            const row = this.data[position];
            if (row) {
                this.data[position] = {...this.data[position], ...set, _id: row._id }
            } else {
                errors++
            }
        })
        return {
            success: true,
            updated: (positions.length+1)-errors,
            failed: errors            
        }
    }

    addIndex(field: string) {
        this.indexes[field] = new Index(field);
        // have to build index with current data
        this.indexes[field].build(this.data);
    }

    removeIndex(field: string) {
        delete this.indexes[field]
    }

    updateIndexesForRow(row: any, position: number) {
        for (const key in this.indexes) {
            if (Object.prototype.hasOwnProperty.call(this.indexes, key)) {
                const index = this.indexes[key];
                index.add(position, row[key])
            }
        }
    }

    isIndexed(key: string) {
        return !!this.indexes[key]
    }

    isOperation(key: string) {
        return key.startsWith("$")
    }

    build(data: any[]) {
        const formatted: any = [];
        data.forEach(row => {
            if (row._id) {
                // ensure no duplicates
                throw new Error("Cant provide custom _id");
            } else {
                row._id = this.generateId();
            }
            formatted.push(row)
        })
        return data
    }
}

export default Table

const a = new Table([
    { a: 'test', b: '1' },
    { a: 'test', b: '2' },
    { a: 'test', b: '2' },
    { a: 'test2', b: '2' },
    { a: 'test3', b: '1' },
    { a: 'test4' },
    { a: 'test5' },
])
// console.log(a)
// a.addIndex('a');
// a.addIndex('b');

// console.log(a.indexes.a)
// console.log(a.indexes.b)

console.log(a.update({
    a: "test",
    b: '1'
}, {lol: "Ok"}))

console.log(a.data)
console.log(a.empty)

a.create({c: "bingo"})

console.log(a.data)
console.log(a.empty)
// a.executeQuery({
//     _id: 2
// })

