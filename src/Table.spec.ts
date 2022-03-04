import Table from "./Table";

describe('Table', () => {
    describe('constructor', () => {
        it.todo('will populate the table with provided data')
        it.todo('will add indexes when provided')
    });
    describe('generateId', () => {
        it('will provide different ids', () => {
            const table = new Table();
            const id1 = table.generateId();
            const id2 = table.generateId();
            expect(id1).not.toBe(id2);
        })
    });    
    describe('executeQuery', () => {
        it.todo('will return all data when an empty object provided')
        it.todo('will return the correct data when using indexes')
        it.todo('will return the correct data when not using indexes')
        it.todo('will return the correct data when using a mix of indexes and none')
        describe('Operators', () => {

        })
    });
    describe('create', () => {
        it.todo('will create a new row')
        it.todo('will create a new row using an empty space')
    });
    describe('find', () => {
        it.todo('will return found rows')
    });
    describe('delete', () => {
        it.todo('will remove rows and their indexes')
    });
    describe('update', () => {
        it.todo('will update rows and their indexes')
    });
    describe('addIndex', () => {
        it.todo('will create an index for a field')
        it.todo('will not create an index if it already exists')
    });
    describe('removeIndex', () => {
        it.todo('will remove an index')
    });
    describe('updateIndexesForRow', () => {
        
    });
    describe('isIndexed', () => {
        it.todo('will return true when index found')
        it.todo('will return false when index not found')
    });
    describe('build', () => {
        it.todo('will build data correctly')
        it.todo('will handle _id field being provided')
    });
});