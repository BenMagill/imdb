import Table from './Table';

describe('Table', () => {
	describe('constructor', () => {
		it.todo('will populate the table with provided data');
		it.todo('will add indexes when provided');
	});
	describe('generateId', () => {
		it('will provide different ids', () => {
			const table = new Table();
			const id1 = table.generateId();
			const id2 = table.generateId();
			expect(id1).not.toBe(id2);
		});
	});    
	describe('executeQuery', () => {
		it('will return all data when an empty object provided', () => {
			const table = new Table();
			table.create({a: 'test1', visible: true});
			table.create({a: 'test2', visible: false});
			table.create({a: 'test2', visible: true});

			expect(table.executeQuery({})).toStrictEqual([0, 1, 2]);
		});
		it.todo('will return the correct data when using indexes');
		it.todo('will return the correct data when not using indexes');
		it.todo('will return the correct data when using a mix of indexes and none');
		describe('Operators', () => {return;});
	});
	describe('create', () => {
		it('will create a new row', () => {
			const table = new Table();
			expect(() => table.create({a: 'test'})).not.toThrow();
			expect(table.data[0]?.a).toBe('test');
		});
		it('will create a new row using an empty space', () => {
			const table = new Table();
			table.create({a: 'test'});
			table.create({a: 'test1'});
			table.delete({a: 'test'});
			expect(() => table.create({a: 'test2'})).not.toThrow();
			expect(table.data[0]?.a).toBe('test2');
		});
	});
	describe('find', () => {
		it('will return found rows', () => {
			const table = new Table();
			table.create({a: 'test'});
			table.create({a: 'test1'});
			expect(table.find({a: 'test'})[0]?.a).toBe('test');
		});
	});
	describe('delete', () => {
		it('will remove rows and their indexes', () => {
			const table = new Table({ indexes: ['a'] });
			table.create({a: 'test'});
			table.create({a: 'test1'});
			table.delete({a: 'test'});
			expect(table.data[0]).toBe(null);
			expect(table.empty).toStrictEqual([0]);
			expect(table.indexes['a'].get('test')).toStrictEqual([]);
		});
	});
	describe('update', () => {
		it('will update rows and their indexes', () => {
			const table = new Table({ indexes: ['a'] });
			table.create({a: 'test'});
			table.create({a: 'test1'});
			table.update({a: 'test'}, {a: 'test3', b: 'updated'});
			console.log(JSON.stringify(table));
			expect(table.find({a: 'test3', b: 'updated'})[0]).toStrictEqual({_id: 1, a: 'test3', b: 'updated'});
			expect(table.indexes['a'].get('test3')).toStrictEqual([0]);
		});
	});
	describe('addIndex', () => {
		it.todo('will create an index for a field');
		it.todo('will not create an index if it already exists');
	});
	describe('removeIndex', () => {
		it.todo('will remove an index');
	});
	describe('updateIndexesForRow', () => {return;});
	describe('isIndexed', () => {
		it.todo('will return true when index found');
		it.todo('will return false when index not found');
	});
	describe('build', () => {
		it.todo('will build data correctly');
		it.todo('will handle _id field being provided');
	});
});