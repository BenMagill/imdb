import Table from "./Table";

describe('Table', () => {
    describe('generateId', () => {
        it('will provide different ids', () => {
            const table = new Table();
            const id1 = table.generateId();
            const id2 = table.generateId();
            expect(id1).not.toBe(id2);
        })
    });    
    describe('executeQuery', () => {
        
    });
    describe('create', () => {
        
    });
    describe('find', () => {
        
    });
    describe('delete', () => {
        
    });
    describe('update', () => {
        
    });
    describe('addIndex', () => {
        
    });
    describe('removeIndex', () => {
        
    });
    describe('updateIndexesForRow', () => {
        
    });
    describe('isIndexed', () => {
        
    });
    describe('build', () => {
        
    });
});