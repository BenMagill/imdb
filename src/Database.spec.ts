import Database from './Database';
import Table from './Table';

describe('Database', () => {
	let database: Database;
	beforeEach(() => {
		database = new Database();
	});
	describe('get', () => {
		it('will return a table when it exists', () => {
			const tablename = 'table1';
			database.add(tablename);
			const table = database.get(tablename);
			expect(table).toBeInstanceOf(Table);
		});
		it('will return null when no table found', () => {
			const table = database.get('RANDOM');
			expect(table).toBe(null);
		});
	});

	describe('add', () => {
		it('will create a new table with the provided name', () => {
			const tableName = 'table1';
			const result = database.add(tableName);
			expect(result).toBe(true);
			expect(database.tables[tableName]).toBeInstanceOf(Table);
		});
		it('will fail to create a table when the name already used', () => {
			const tableName = 'table1';
			database.add(tableName);
			expect(() => database.add(tableName)).toThrowError('Table already exists');
		});
	});

	describe('delete', () => {
		it('will remove a table if it exists', () => {
			const tableName = 'table1';
			database.add(tableName);
			const result = database.delete(tableName);
			expect(result).toBe(true);
			expect(database.get(tableName)).toBe(null);
		});
		it('will fail to delete if the table does not exist', () => {
			expect(() => database.delete('RANDOM')).toThrowError('Table does not exist');
		});
	});
});