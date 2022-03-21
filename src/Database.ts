/**
 * basically just a wrapper for managing tables
 * tables can be used without this if wanted
 * 
 */
import Table from './Table';

class Database {
	tables: {
        [key: string]: Table
    };
	constructor() {
		this.tables = {};
	}

	get(name: string): Table | null {
		return this.tables[name] || null;
	}

	add(name: string): boolean {
		if (this.get(name)) {
			throw new Error('Table already exists');
		}        
		this.tables[name] = new Table();
		return true;
	}

	delete(name: string): boolean {
		if (this.get(name)) {
			delete this.tables[name];
			return true;
		} else {
			throw new Error('Table does not exist');
		}
	}
}

export default Database;